package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.documents.dtos.EditorConfigResponse;
import com.sw.organiflow.modules.documents.dtos.OnlyOfficeCallbackRequest;
import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.models.DocumentCategory;
import com.sw.organiflow.modules.documents.models.DocumentVersion;
import com.sw.organiflow.modules.documents.repositories.DocumentAssetRepository;
import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.tenant.repositories.TenantRepository;
import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Integracion con OnlyOffice Document Server para la co-edicion de archivos Office.
 *
 * <p>Arma y firma (JWT) la configuracion del editor que el navegador pasa a
 * {@code DocsAPI.DocEditor}, y procesa el callback de guardado del DS subiendo una nueva
 * version a S3.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OnlyOfficeService {

    private final DocumentAssetRepository documentRepository;
    private final DocumentPermissionService permissionService;
    private final S3StorageService s3;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    private final RestClient restClient = RestClient.create();

    @Value("${app.onlyoffice.enabled:false}")
    private boolean enabled;

    @Value("${app.onlyoffice.url:}")
    private String documentServerUrl;

    @Value("${app.onlyoffice.jwt-secret:}")
    private String jwtSecret;

    @Value("${app.onlyoffice.callback-base:}")
    private String callbackBase;

    public boolean isEnabled() {
        return enabled;
    }

    // ----------------------------------------------------------------
    // Config del editor
    // ----------------------------------------------------------------

    public EditorConfigResponse buildEditorConfig(String documentId) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "La co-edicion Office no esta habilitada");
        }

        String tenantId = SecurityUtils.getCurrentTenantId();
        DocumentAsset asset = documentRepository.findByIdAndTenantId(documentId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Documento no encontrado o no pertenece a tu empresa"));

        if (!asset.getCategory().isOffice()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo los archivos Office (Word/Excel/PowerPoint) son co-editables");
        }

        String userId = SecurityUtils.getCurrentUserId();
        String role = SecurityUtils.getCurrentRole();
        if (!permissionService.canView(asset, userId, role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este documento");
        }

        boolean canEdit = permissionService.canEdit(asset, userId, role);
        boolean canDownload = permissionService.canDownload(asset, userId, role);
        boolean canComment = permissionService.canComment(asset, userId, role);

        Map<String, Object> permissions = new LinkedHashMap<>();
        permissions.put("edit", canEdit);
        permissions.put("comment", canComment);
        permissions.put("download", canDownload);
        permissions.put("print", canDownload);
        permissions.put("fillForms", canEdit);

        Map<String, Object> document = new LinkedHashMap<>();
        document.put("fileType", fileExtension(asset.getOriginalName()));
        document.put("key", asset.getDocumentKey());
        document.put("title", asset.getOriginalName());
        // Proxy por el backend en vez de URL prefirmada directa: OnlyOffice (con JWT) agrega un
        // header Authorization que S3 rechaza ("only one auth mechanism allowed", 400).
        document.put("url", callbackBase + "/api/v1/documents/" + documentId
                + "/onlyoffice/file?token=" + signFileToken(documentId));
        document.put("permissions", permissions);

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", userId);
        user.put("name", resolveUserName(userId));

        Map<String, Object> customization = new LinkedHashMap<>();
        customization.put("autosave", true);
        customization.put("forcesave", true);

        Map<String, Object> editorConfig = new LinkedHashMap<>();
        editorConfig.put("mode", canEdit ? "edit" : "view");
        editorConfig.put("lang", "es");
        editorConfig.put("callbackUrl",
                callbackBase + "/api/v1/documents/" + documentId + "/onlyoffice/callback");
        editorConfig.put("user", user);
        editorConfig.put("customization", customization);

        Map<String, Object> config = new LinkedHashMap<>();
        config.put("document", document);
        config.put("documentType", documentType(asset.getCategory()));
        config.put("editorConfig", editorConfig);
        config.put("type", "desktop");
        config.put("width", "100%");
        config.put("height", "100%");

        config.put("token", sign(config));

        return new EditorConfigResponse(documentServerUrl, config);
    }

    // ----------------------------------------------------------------
    // Callback de guardado
    // ----------------------------------------------------------------

    public Map<String, Object> handleCallback(String documentId, OnlyOfficeCallbackRequest req, String authHeader) {
        verifyCallbackToken(authHeader, req.token());

        // El callback no trae contexto de usuario/tenant: se busca por id (validado por el JWT del DS).
        DocumentAsset asset = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));

        // 2 = listo para guardar, 6 = force-save → descargar el editado y versionar.
        if (req.status() == 2 || req.status() == 6) {
            persistNewVersion(asset, req);
        }
        return Map.of("error", 0);
    }

    private void persistNewVersion(DocumentAsset asset, OnlyOfficeCallbackRequest req) {
        byte[] edited = restClient.get().uri(req.url()).retrieve().body(byte[].class);
        if (edited == null || edited.length == 0) {
            log.warn("Callback OnlyOffice sin contenido para doc {}", asset.getId());
            return;
        }

        int newVersion = asset.getCurrentVersion() + 1;
        String slug = resolveClienteSlug(asset.getTenantId());
        String newKey = s3.buildKey(slug, asset.getScope(), asset.getWorkflowId(),
                asset.getExecutionId(), asset.getId(), newVersion, asset.getOriginalName());

        s3.putBytes(newKey, edited, asset.getMimeType());

        String savedBy = (req.users() != null && !req.users().isEmpty()) ? req.users().get(0) : null;
        asset.getVersions().add(DocumentVersion.builder()
                .versionNumber(newVersion)
                .s3Key(newKey)
                .sizeBytes(edited.length)
                .savedByUserId(savedBy)
                .savedAt(LocalDateTime.now())
                .comment("Co-edicion OnlyOffice")
                .build());

        asset.setS3Key(newKey);
        asset.setSizeBytes(edited.length);
        asset.setCurrentVersion(newVersion);
        asset.setDocumentKey(asset.getId() + "-v" + newVersion);
        documentRepository.save(asset);

        log.info("Documento {} versionado a v{} via OnlyOffice", asset.getId(), newVersion);
    }

    // ----------------------------------------------------------------
    // Proxy de descarga (evita el conflicto de doble auth con S3)
    // ----------------------------------------------------------------

    /** Sirve el archivo al Document Server, leyéndolo de S3 (validado por el token firmado). */
    public ResponseEntity<byte[]> serveEditorFile(String documentId, String token) {
        verifyFileToken(documentId, token);
        DocumentAsset asset = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));

        byte[] bytes = s3.downloadBytes(asset.getS3Key());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, asset.getMimeType() != null
                        ? asset.getMimeType() : "application/octet-stream")
                .body(bytes);
    }

    private String signFileToken(String documentId) {
        return Jwts.builder()
                .claim("documentId", documentId)
                .claim("purpose", "download")
                .expiration(new Date(System.currentTimeMillis() + 3_600_000)) // 1 h
                .signWith(signingKey())
                .compact();
    }

    private void verifyFileToken(String documentId, String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Falta el token de descarga");
        }
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey()).build()
                    .parseSignedClaims(token).getPayload();
            if (!documentId.equals(claims.get("documentId", String.class))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Token no corresponde al documento");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de descarga inválido");
        }
    }

    // ----------------------------------------------------------------
    // JWT (firma/verificacion con el secreto compartido del DS)
    // ----------------------------------------------------------------

    private String sign(Map<String, Object> claims) {
        return Jwts.builder().claims(claims).signWith(signingKey()).compact();
    }

    private void verifyCallbackToken(String authHeader, String bodyToken) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (bodyToken != null && !bodyToken.isBlank()) {
            token = bodyToken;
        }

        if (token == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Falta el token JWT del Document Server");
        }
        try {
            Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token del Document Server invalido");
        }
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private String documentType(DocumentCategory category) {
        return switch (category) {
            case OFFICE_WORD -> "word";
            case OFFICE_CELL -> "cell";
            case OFFICE_SLIDE -> "slide";
            default -> "word";
        };
    }

    private String fileExtension(String fileName) {
        if (fileName == null) return "docx";
        int dot = fileName.lastIndexOf('.');
        return (dot >= 0 && dot < fileName.length() - 1)
                ? fileName.substring(dot + 1).toLowerCase()
                : "docx";
    }

    private String resolveUserName(String userId) {
        if (userId == null) return "Usuario";
        return userRepository.findById(userId)
                .map(User::getName)
                .filter(n -> n != null && !n.isBlank())
                .orElseGet(() -> {
                    String email = SecurityUtils.getCurrentEmail();
                    return email != null ? email : "Usuario";
                });
    }

    private String resolveClienteSlug(String tenantId) {
        return tenantRepository.findById(tenantId)
                .map(Tenant::getSlug)
                .filter(s -> s != null && !s.isBlank())
                .orElse(tenantId);
    }
}
