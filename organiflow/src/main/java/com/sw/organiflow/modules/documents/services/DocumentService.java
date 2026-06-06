package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.department.models.Department;
import com.sw.organiflow.modules.department.repositories.DepartmentRepository;
import com.sw.organiflow.modules.documents.dtos.*;
import com.sw.organiflow.modules.documents.models.*;
import com.sw.organiflow.modules.documents.repositories.DocumentAssetRepository;
import com.sw.organiflow.modules.notifications.services.NotificationService;
import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.tenant.repositories.TenantRepository;
import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Logica de negocio de documentos: emision de URLs prefirmadas, confirmacion de subida,
 * listados, gestion de permisos por usuario (filtrados al departamento del nodo) y borrado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentAssetRepository documentRepository;
    private final DepartmentRepository departmentRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3;
    private final DocumentPermissionService permissionService;
    private final NotificationService notificationService;

    /** Limite de tamano por categoria (bytes). */
    private static final long MAX_VIDEO = 1024L * 1024 * 1024;   // 1 GB
    private static final long MAX_DEFAULT = 100L * 1024 * 1024;  // 100 MB

    // ----------------------------------------------------------------
    // Subida
    // ----------------------------------------------------------------

    public PresignUploadResponse presignUpload(PresignUploadRequest req) {
        String tenantId = requireTenant();
        DocumentCategory category = DocumentCategory.fromMime(req.mimeType());
        validateSize(category, req.sizeBytes());

        if (req.scope() == DocumentScope.RUNTIME
                && (isBlank(req.executionId()) || isBlank(req.taskId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "executionId y taskId son obligatorios para documentos de ejecucion");
        }

        String slug = resolveClienteSlug(tenantId);
        String uploaderId = SecurityUtils.getCurrentUserId();

        // El usuario que sube conserva acceso total a su propio documento.
        List<DocumentPermission> initialPermissions = new ArrayList<>();
        if (uploaderId != null) {
            initialPermissions.add(DocumentPermission.builder()
                    .userId(uploaderId)
                    .canView(true).canEdit(true).canComment(true).canDownload(true)
                    .build());
        }

        // Se guarda primero para obtener el id y construir la clave S3 con el.
        DocumentAsset asset = DocumentAsset.builder()
                .tenantId(tenantId)
                .workflowId(req.workflowId())
                .nodeId(req.nodeId())
                .departmentId(req.departmentId())
                .executionId(req.executionId())
                .taskId(req.taskId())
                .scope(req.scope())
                .originalName(req.fileName())
                .mimeType(req.mimeType())
                .category(category)
                .sizeBytes(req.sizeBytes())
                .currentVersion(1)
                .uploadedByUserId(uploaderId)
                .status(DocumentStatus.PENDING_UPLOAD)
                .permissions(initialPermissions)
                .build();

        asset = documentRepository.save(asset);

        String key = s3.buildKey(slug, req.scope(), req.workflowId(), req.executionId(),
                asset.getId(), 1, req.fileName());
        asset.setS3Key(key);
        asset.setDocumentKey(asset.getId() + "-v1");
        documentRepository.save(asset);

        String uploadUrl = s3.presignPut(key, req.mimeType());
        log.info("Presigned upload generada doc={} key={}", asset.getId(), key);
        return new PresignUploadResponse(asset.getId(), uploadUrl, key, req.mimeType());
    }

    public DocumentResponse confirmUpload(ConfirmUploadRequest req) {
        DocumentAsset asset = findOwned(req.documentId());

        long size = s3.headSizeBytes(asset.getS3Key())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El archivo no se encuentra en S3; la subida no se completo"));

        asset.setSizeBytes(size);
        asset.setStatus(DocumentStatus.READY);
        asset.getVersions().add(DocumentVersion.builder()
                .versionNumber(1)
                .s3Key(asset.getS3Key())
                .sizeBytes(size)
                .savedByUserId(asset.getUploadedByUserId())
                .savedAt(LocalDateTime.now())
                .comment("Version inicial")
                .build());

        DocumentAsset saved = documentRepository.save(asset);
        return toResponse(saved);
    }

    // ----------------------------------------------------------------
    // Listados
    // ----------------------------------------------------------------

    public List<DocumentResponse> listByNode(String nodeId) {
        String tenantId = requireTenant();
        return documentRepository
                .findByTenantIdAndNodeIdAndScope(tenantId, nodeId, DocumentScope.TEMPLATE)
                .stream()
                .filter(this::isReady)
                .filter(this::currentUserCanView)
                .map(this::toResponse)
                .toList();
    }

    public List<DocumentResponse> listByTask(String taskId) {
        String tenantId = requireTenant();
        return documentRepository.findByTenantIdAndTaskId(tenantId, taskId)
                .stream()
                .filter(this::isReady)
                .filter(this::currentUserCanView)
                .map(this::toResponse)
                .toList();
    }

    private boolean isReady(DocumentAsset asset) {
        return asset.getStatus() == DocumentStatus.READY;
    }

    /** Todos los documentos compartidos con el usuario actual (permiso de ver), de cualquier tarea/nodo. */
    public List<DocumentResponse> listAccessible() {
        String tenantId = requireTenant();
        String userId = SecurityUtils.getCurrentUserId();
        if (isBlank(userId)) return List.of();

        return documentRepository.findByTenantIdAndPermissionsUserId(tenantId, userId).stream()
                .filter(this::isReady)
                .filter(d -> d.getPermissions().stream()
                        .anyMatch(p -> userId.equals(p.getUserId()) && p.isCanView()))
                .map(this::toResponse)
                .toList();
    }

    public DocumentResponse getMetadata(String id) {
        DocumentAsset asset = findOwned(id);
        requireView(asset);
        return toResponse(asset);
    }

    public DownloadUrlResponse getDownloadUrl(String id) {
        DocumentAsset asset = findOwned(id);
        if (!permissionService.canView(asset, SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este documento");
        }
        String url = s3.presignGet(asset.getS3Key());
        return new DownloadUrlResponse(url, asset.getMimeType(), asset.getOriginalName());
    }

    // ----------------------------------------------------------------
    // Permisos
    // ----------------------------------------------------------------

    /** Reemplaza los permisos. Solo se aceptan usuarios miembros del departamento del nodo. */
    public DocumentResponse setPermissions(String id, SetPermissionsRequest request) {
        DocumentAsset asset = findOwned(id);

        // Quiénes ya podían ver antes (para notificar solo a los nuevos).
        Set<String> previousViewers = new LinkedHashSet<>();
        for (DocumentPermission p : asset.getPermissions()) {
            if (p.isCanView() && p.getUserId() != null) previousViewers.add(p.getUserId());
        }

        Set<String> allowed = departmentMemberIds(asset.getDepartmentId());
        List<DocumentPermission> permissions = new ArrayList<>();
        for (DocumentPermissionDto dto : request.permissions()) {
            if (!allowed.contains(dto.userId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El usuario " + dto.userId() + " no pertenece al departamento del nodo");
            }
            permissions.add(dto.toModel());
        }
        asset.setPermissions(permissions);
        DocumentAsset saved = documentRepository.save(asset);

        // Notifica a los usuarios recién habilitados (canView) que no podían ver antes.
        String currentUserId = SecurityUtils.getCurrentUserId();
        permissions.stream()
                .filter(p -> p.isCanView() && p.getUserId() != null)
                .map(DocumentPermission::getUserId)
                .filter(uid -> !previousViewers.contains(uid) && !uid.equals(currentUserId))
                .forEach(uid -> notificationService.notifyDocumentShared(
                        saved.getTenantId(), uid, saved.getId(), saved.getOriginalName()));

        return toResponse(saved);
    }

    /** Miembros del departamento del nodo: candidatos a recibir permisos. */
    public List<PermissionCandidateResponse> getPermissionCandidates(String departmentId) {
        Set<String> memberIds = departmentMemberIds(departmentId);
        if (memberIds.isEmpty()) return List.of();
        return userRepository.findAllById(memberIds).stream()
                .map(PermissionCandidateResponse::from)
                .toList();
    }

    // ----------------------------------------------------------------
    // Borrado
    // ----------------------------------------------------------------

    public void delete(String id) {
        DocumentAsset asset = findOwned(id);
        boolean isAdmin = permissionService.isAdmin(SecurityUtils.getCurrentRole());
        boolean isOwner = asset.getUploadedByUserId() != null
                && asset.getUploadedByUserId().equals(SecurityUtils.getCurrentUserId());
        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el admin o quien subio el documento puede eliminarlo");
        }

        // Borra todos los objetos de S3 (version actual + historicas).
        Set<String> keys = new LinkedHashSet<>();
        if (asset.getS3Key() != null) keys.add(asset.getS3Key());
        asset.getVersions().forEach(v -> keys.add(v.getS3Key()));
        keys.forEach(s3::delete);

        documentRepository.delete(asset);
        log.info("Documento eliminado: {}", id);
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private DocumentAsset findOwned(String id) {
        String tenantId = requireTenant();
        return documentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Documento no encontrado o no pertenece a tu empresa"));
    }

    private void requireView(DocumentAsset asset) {
        if (!permissionService.canView(asset, SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este documento");
        }
    }

    private boolean currentUserCanView(DocumentAsset asset) {
        return permissionService.canView(asset, SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentRole());
    }

    private DocumentResponse toResponse(DocumentAsset asset) {
        DocumentPermissionDto mine = permissionService.effectiveFor(
                asset, SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentRole());
        return DocumentResponse.from(asset, mine);
    }

    private Set<String> departmentMemberIds(String departmentId) {
        if (isBlank(departmentId)) return Set.of();
        String tenantId = requireTenant();
        Department dept = departmentRepository.findByIdAndTenantId(departmentId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Departamento no encontrado"));
        Set<String> ids = new LinkedHashSet<>(dept.getMemberUserIds());
        if (!isBlank(dept.getHeadUserId())) ids.add(dept.getHeadUserId());
        return ids;
    }

    private String resolveClienteSlug(String tenantId) {
        return tenantRepository.findById(tenantId)
                .map(Tenant::getSlug)
                .filter(s -> s != null && !s.isBlank())
                .orElse(tenantId);
    }

    private void validateSize(DocumentCategory category, long sizeBytes) {
        long max = category == DocumentCategory.VIDEO ? MAX_VIDEO : MAX_DEFAULT;
        if (sizeBytes > max) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "El archivo supera el tamano maximo permitido (" + (max / (1024 * 1024)) + " MB)");
        }
    }

    private String requireTenant() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        if (isBlank(tenantId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant no resuelto");
        }
        return tenantId;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
