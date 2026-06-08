package com.sw.organiflow.modules.documents.dtos;

import jakarta.validation.constraints.NotBlank;

/** Payload para editar el texto de un comentario. */
public record UpdateAnnotationRequest(
        @NotBlank String text
) {}
