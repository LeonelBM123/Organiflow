package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.models.DocumentCategory;
import com.sw.organiflow.modules.documents.models.DocumentScope;
import com.sw.organiflow.modules.documents.models.DocumentStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Metadata de un documento. Incluye la lista de permisos (para el admin que configura) y el
 * permiso efectivo del usuario que consulta ({@code myPermission}) para que el frontend sepa
 * que acciones habilitar.
 */
public record DocumentResponse(
        String id,
        String workflowId,
        String nodeId,
        String departmentId,
        String executionId,
        String taskId,
        DocumentScope scope,
        String originalName,
        String mimeType,
        DocumentCategory category,
        long sizeBytes,
        int currentVersion,
        String uploadedByUserId,
        DocumentStatus status,
        List<DocumentPermissionDto> permissions,
        DocumentPermissionDto myPermission,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DocumentResponse from(DocumentAsset d, DocumentPermissionDto myPermission) {
        return new DocumentResponse(
                d.getId(),
                d.getWorkflowId(),
                d.getNodeId(),
                d.getDepartmentId(),
                d.getExecutionId(),
                d.getTaskId(),
                d.getScope(),
                d.getOriginalName(),
                d.getMimeType(),
                d.getCategory(),
                d.getSizeBytes(),
                d.getCurrentVersion(),
                d.getUploadedByUserId(),
                d.getStatus(),
                d.getPermissions().stream().map(DocumentPermissionDto::from).toList(),
                myPermission,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
