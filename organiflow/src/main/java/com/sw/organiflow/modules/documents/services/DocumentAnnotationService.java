package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.activity.models.ActivityEventType;
import com.sw.organiflow.modules.activity.services.ActivityEventService;
import com.sw.organiflow.modules.documents.dtos.AnnotationEvent;
import com.sw.organiflow.modules.documents.dtos.AnnotationResponse;
import com.sw.organiflow.modules.documents.dtos.CreateAnnotationRequest;
import com.sw.organiflow.modules.documents.dtos.UpdateAnnotationRequest;
import com.sw.organiflow.modules.documents.models.AnnotationType;
import com.sw.organiflow.modules.documents.models.DocumentAnnotation;
import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.repositories.DocumentAnnotationRepository;
import com.sw.organiflow.modules.documents.repositories.DocumentAssetRepository;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Anotaciones colaborativas (dibujo libre y comentarios) sobre documentos.
 *
 * <p>Permisos (vía {@link DocumentPermissionService}): ver requiere {@code canView}; crear un
 * trazo {@code DRAWING} requiere {@code canEdit}; crear un {@code COMMENT} requiere
 * {@code canComment}; editar es solo del autor; borrar es del autor o del {@code admin}.</p>
 *
 * <p>Cada escritura se difunde por WebSocket a {@code /topic/document.{tenantId}.{documentId}}.</p>
 */
@Service
@RequiredArgsConstructor
public class DocumentAnnotationService {

    private final DocumentAnnotationRepository annotationRepository;
    private final DocumentAssetRepository documentRepository;
    private final DocumentPermissionService permissionService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ActivityEventService activityEventService;

    private static final String TOPIC_PREFIX = "/topic/document.";

    public List<AnnotationResponse> list(String documentId) {
        String tenantId = requireTenant();
        DocumentAsset doc = loadOwned(documentId, tenantId);
        requireView(doc);
        return annotationRepository
                .findByTenantIdAndDocumentIdOrderByCreatedAtAsc(tenantId, documentId)
                .stream()
                .map(AnnotationResponse::from)
                .toList();
    }

    public AnnotationResponse create(String documentId, CreateAnnotationRequest req) {
        String tenantId = requireTenant();
        String userId = SecurityUtils.getCurrentUserId();
        String role = SecurityUtils.getCurrentRole();
        DocumentAsset doc = loadOwned(documentId, tenantId);

        // Gate según el tipo: markup (dibujo/texto) = canEdit; comentario = canComment.
        if (req.type() == AnnotationType.COMMENT) {
            if (!permissionService.canComment(doc, userId, role)) {
                throw forbidden("No tienes permiso para comentar este documento");
            }
            if (isBlank(req.text())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El comentario no puede estar vacío");
            }
        } else {
            if (!permissionService.canEdit(doc, userId, role)) {
                throw forbidden("No tienes permiso para anotar (dibujar/escribir) sobre este documento");
            }
            if (req.type() == AnnotationType.TEXT && isBlank(req.text())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El texto no puede estar vacío");
            }
        }

        DocumentAnnotation annotation = DocumentAnnotation.builder()
                .tenantId(tenantId)
                .documentId(documentId)
                .type(req.type())
                .page(req.page())
                .geometry(req.geometry())
                .color(req.color())
                .strokeWidth(req.strokeWidth())
                .text(req.text())
                .authorUserId(userId)
                .authorName(resolveAuthorName(userId))
                .build();

        DocumentAnnotation saved = annotationRepository.save(annotation);
        AnnotationResponse response = AnnotationResponse.from(saved);
        broadcast(tenantId, documentId, AnnotationEvent.created(response));

        if (doc.getExecutionId() != null) {
            ActivityEventType eventType = req.type() == AnnotationType.COMMENT
                    ? ActivityEventType.COMMENT_ADDED
                    : ActivityEventType.ANNOTATION_ADDED;
            java.util.Map<String, Object> meta = req.type() == AnnotationType.COMMENT
                    ? java.util.Map.of("text", req.text() != null && req.text().length() > 100
                            ? req.text().substring(0, 100) + "…" : req.text() != null ? req.text() : "",
                            "documentId", documentId)
                    : java.util.Map.of("annotationType", req.type().name(),
                            "page", req.page() != null ? req.page() : 1,
                            "documentId", documentId);
            activityEventService.record(tenantId, doc.getExecutionId(), documentId,
                    userId, eventType, "ANNOTATION", saved.getId(), meta);
        }

        return response;
    }

    public AnnotationResponse update(String documentId, String annotationId, UpdateAnnotationRequest req) {
        String tenantId = requireTenant();
        DocumentAnnotation annotation = loadAnnotation(annotationId, tenantId, documentId);

        if (!annotation.getAuthorUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw forbidden("Solo el autor puede editar esta anotación");
        }
        annotation.setText(req.text());

        DocumentAnnotation saved = annotationRepository.save(annotation);
        AnnotationResponse response = AnnotationResponse.from(saved);
        broadcast(tenantId, documentId, AnnotationEvent.updated(response));
        return response;
    }

    public void delete(String documentId, String annotationId) {
        String tenantId = requireTenant();
        DocumentAnnotation annotation = loadAnnotation(annotationId, tenantId, documentId);

        boolean isAuthor = annotation.getAuthorUserId().equals(SecurityUtils.getCurrentUserId());
        boolean isAdmin = permissionService.isAdmin(SecurityUtils.getCurrentRole());
        if (!isAuthor && !isAdmin) {
            throw forbidden("Solo el autor o un administrador pueden borrar esta anotación");
        }

        annotationRepository.delete(annotation);
        broadcast(tenantId, documentId, AnnotationEvent.deleted(AnnotationResponse.from(annotation)));

        documentRepository.findByIdAndTenantId(documentId, tenantId).ifPresent(doc -> {
            if (doc.getExecutionId() != null) {
                activityEventService.record(tenantId, doc.getExecutionId(), documentId,
                        SecurityUtils.getCurrentUserId(),
                        ActivityEventType.ANNOTATION_REMOVED, "ANNOTATION", annotationId,
                        java.util.Map.of("documentId", documentId));
            }
        });
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private void broadcast(String tenantId, String documentId, AnnotationEvent event) {
        messagingTemplate.convertAndSend(TOPIC_PREFIX + tenantId + "." + documentId, event);
    }

    private DocumentAsset loadOwned(String documentId, String tenantId) {
        return documentRepository.findByIdAndTenantId(documentId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
    }

    private DocumentAnnotation loadAnnotation(String annotationId, String tenantId, String documentId) {
        DocumentAnnotation annotation = annotationRepository.findByIdAndTenantId(annotationId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Anotación no encontrada"));
        if (!annotation.getDocumentId().equals(documentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La anotación no pertenece a este documento");
        }
        return annotation;
    }

    private void requireView(DocumentAsset doc) {
        if (!permissionService.canView(doc, SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentRole())) {
            throw forbidden("No tienes acceso a este documento");
        }
    }

    private String resolveAuthorName(String userId) {
        return userRepository.findById(userId)
                .map(u -> u.getName() != null ? u.getName() : u.getEmail())
                .orElse("Usuario");
    }

    private String requireTenant() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión sin tenant");
        }
        return tenantId;
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
