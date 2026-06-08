package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.documents.models.AnnotationType;
import jakarta.validation.constraints.NotNull;

/**
 * Payload para crear una anotación. Según {@code type}:
 * <ul>
 *   <li>{@code DRAWING}: usa {@code page}, {@code geometry}, {@code color}, {@code strokeWidth}.</li>
 *   <li>{@code COMMENT}: usa {@code text} (y {@code page} opcional para anclarlo en un PDF).</li>
 * </ul>
 */
public record CreateAnnotationRequest(
        @NotNull AnnotationType type,
        Integer page,
        String geometry,
        String color,
        Double strokeWidth,
        String text
) {}
