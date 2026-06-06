package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.documents.models.DocumentScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Solicitud para obtener una URL prefirmada de subida. El backend valida mime/size/permiso,
 * crea la metadata del documento en estado PENDING_UPLOAD y devuelve la URL PUT.
 *
 * <p>Para TEMPLATE: requiere {@code workflowId}, {@code nodeId}, {@code departmentId}.
 * Para RUNTIME: requiere ademas {@code executionId} y {@code taskId}.</p>
 */
public record PresignUploadRequest(
        @NotNull DocumentScope scope,
        @NotBlank String workflowId,
        @NotBlank String nodeId,
        String departmentId,
        String executionId,
        String taskId,
        @NotBlank String fileName,
        @NotBlank String mimeType,
        @Positive long sizeBytes
) {}
