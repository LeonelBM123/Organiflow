package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.documents.models.AnnotationType;
import com.sw.organiflow.modules.documents.models.DocumentAnnotation;

import java.time.LocalDateTime;

/** Representación de una anotación para el frontend. */
public record AnnotationResponse(
        String id,
        String documentId,
        AnnotationType type,
        Integer page,
        String geometry,
        String color,
        Double strokeWidth,
        String text,
        String authorUserId,
        String authorName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AnnotationResponse from(DocumentAnnotation a) {
        return new AnnotationResponse(
                a.getId(),
                a.getDocumentId(),
                a.getType(),
                a.getPage(),
                a.getGeometry(),
                a.getColor(),
                a.getStrokeWidth(),
                a.getText(),
                a.getAuthorUserId(),
                a.getAuthorName(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
