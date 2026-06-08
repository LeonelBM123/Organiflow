package com.sw.organiflow.modules.documents.controllers;

import com.sw.organiflow.modules.documents.dtos.*;
import com.sw.organiflow.modules.documents.services.DocumentAnnotationService;
import com.sw.organiflow.modules.documents.services.DocumentService;
import com.sw.organiflow.modules.documents.services.OnlyOfficeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API de documentos colaborativos por nodo. La subida se hace con URLs prefirmadas
 * directo a S3 (el backend solo valida, guarda metadata y controla acceso).
 */
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final OnlyOfficeService onlyOfficeService;
    private final DocumentAnnotationService annotationService;

    /** Emite la URL prefirmada de subida y crea la metadata en estado PENDING_UPLOAD. */
    @PostMapping("/presign-upload")
    public ResponseEntity<PresignUploadResponse> presignUpload(
            @Valid @RequestBody PresignUploadRequest request) {
        return ResponseEntity.ok(documentService.presignUpload(request));
    }

    /** Confirma que el archivo ya se subio a S3; el documento pasa a READY. */
    @PostMapping("/confirm")
    public ResponseEntity<DocumentResponse> confirm(
            @Valid @RequestBody ConfirmUploadRequest request) {
        return ResponseEntity.ok(documentService.confirmUpload(request));
    }

    /** Plantillas (configuracion) adjuntas a un nodo. */
    @GetMapping("/node/{nodeId}")
    public ResponseEntity<List<DocumentResponse>> listByNode(@PathVariable String nodeId) {
        return ResponseEntity.ok(documentService.listByNode(nodeId));
    }

    /** Documentos subidos durante la ejecucion de una tarea. */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<DocumentResponse>> listByTask(@PathVariable String taskId) {
        return ResponseEntity.ok(documentService.listByTask(taskId));
    }

    /** Todos los documentos compartidos con el usuario actual (de cualquier tarea/nodo). */
    @GetMapping("/accessible")
    public ResponseEntity<List<DocumentResponse>> listAccessible() {
        return ResponseEntity.ok(documentService.listAccessible());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getMetadata(@PathVariable String id) {
        return ResponseEntity.ok(documentService.getMetadata(id));
    }

    /** URL prefirmada temporal para descargar/visualizar el archivo. */
    @GetMapping("/{id}/download")
    public ResponseEntity<DownloadUrlResponse> getDownloadUrl(@PathVariable String id) {
        return ResponseEntity.ok(documentService.getDownloadUrl(id));
    }

    /** Candidatos a recibir permisos: miembros del departamento del nodo. */
    @GetMapping("/permission-candidates")
    public ResponseEntity<List<PermissionCandidateResponse>> permissionCandidates(
            @RequestParam String departmentId) {
        return ResponseEntity.ok(documentService.getPermissionCandidates(departmentId));
    }

    /** Asigna permisos por usuario (solo admin). */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DocumentResponse> setPermissions(
            @PathVariable String id,
            @Valid @RequestBody SetPermissionsRequest request) {
        return ResponseEntity.ok(documentService.setPermissions(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        documentService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // ── Anotaciones colaborativas: dibujo libre (PDF) y comentarios (PDF/imagen/video) ──

    /** Lista las anotaciones del documento (requiere canView). */
    @GetMapping("/{id}/annotations")
    public ResponseEntity<List<AnnotationResponse>> listAnnotations(@PathVariable String id) {
        return ResponseEntity.ok(annotationService.list(id));
    }

    /** Crea una anotación: DRAWING requiere canEdit; COMMENT requiere canComment. */
    @PostMapping("/{id}/annotations")
    public ResponseEntity<AnnotationResponse> createAnnotation(
            @PathVariable String id,
            @Valid @RequestBody CreateAnnotationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(annotationService.create(id, request));
    }

    /** Edita el texto de un comentario (solo el autor). */
    @PutMapping("/{id}/annotations/{annotationId}")
    public ResponseEntity<AnnotationResponse> updateAnnotation(
            @PathVariable String id,
            @PathVariable String annotationId,
            @Valid @RequestBody UpdateAnnotationRequest request) {
        return ResponseEntity.ok(annotationService.update(id, annotationId, request));
    }

    /** Borra una anotación (autor o admin). */
    @DeleteMapping("/{id}/annotations/{annotationId}")
    public ResponseEntity<Void> deleteAnnotation(
            @PathVariable String id,
            @PathVariable String annotationId) {
        annotationService.delete(id, annotationId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // ── Co-edicion Office (OnlyOffice) ────────────────────────────────────────

    /** Indica si la co-edicion Office esta habilitada (para que el front muestre "Editar"). */
    @GetMapping("/onlyoffice/enabled")
    public ResponseEntity<Map<String, Boolean>> onlyOfficeEnabled() {
        return ResponseEntity.ok(Map.of("enabled", onlyOfficeService.isEnabled()));
    }

    /** Configuracion firmada para montar el editor de OnlyOffice en el navegador. */
    @GetMapping("/{id}/editor-config")
    public ResponseEntity<EditorConfigResponse> editorConfig(@PathVariable String id) {
        return ResponseEntity.ok(onlyOfficeService.buildEditorConfig(id));
    }

    /**
     * Callback del Document Server (server-to-server, sin Bearer de usuario; se valida con el
     * JWT de OnlyOffice). Debe devolver siempre {@code {"error":0}} cuando procesa bien.
     */
    @PostMapping("/{id}/onlyoffice/callback")
    public ResponseEntity<Map<String, Object>> onlyOfficeCallback(
            @PathVariable String id,
            @RequestBody OnlyOfficeCallbackRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(onlyOfficeService.handleCallback(id, request, authHeader));
    }

    /**
     * Proxy de descarga para el Document Server (lee de S3 y se lo entrega). Evita el conflicto
     * de doble auth con S3 (OnlyOffice agrega un header Authorization que S3 rechaza). Público,
     * asegurado por el token firmado en la query.
     */
    @GetMapping("/{id}/onlyoffice/file")
    public ResponseEntity<byte[]> onlyOfficeFile(
            @PathVariable String id,
            @RequestParam String token) {
        return onlyOfficeService.serveEditorFile(id, token);
    }
}
