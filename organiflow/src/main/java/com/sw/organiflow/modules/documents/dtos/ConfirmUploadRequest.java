package com.sw.organiflow.modules.documents.dtos;

import jakarta.validation.constraints.NotBlank;

/** Confirma que el archivo ya fue subido a S3; el backend lo marca READY. */
public record ConfirmUploadRequest(
        @NotBlank String documentId
) {}
