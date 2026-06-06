package com.sw.organiflow.modules.documents.dtos;

/**
 * Respuesta con la URL prefirmada para que el navegador suba el archivo directo a S3
 * mediante un PUT con el header {@code Content-Type} indicado.
 */
public record PresignUploadResponse(
        String documentId,
        String uploadUrl,
        String s3Key,
        String requiredContentType
) {}
