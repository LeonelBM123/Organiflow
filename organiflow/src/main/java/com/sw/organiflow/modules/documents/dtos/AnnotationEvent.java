package com.sw.organiflow.modules.documents.dtos;

/**
 * Evento difundido por WebSocket a {@code /topic/document.{tenantId}.{documentId}} cuando una
 * anotación se crea, actualiza o elimina, para que los visores abiertos se sincronicen.
 */
public record AnnotationEvent(
        Action action,
        AnnotationResponse annotation
) {
    public enum Action { CREATED, UPDATED, DELETED }

    public static AnnotationEvent created(AnnotationResponse a) {
        return new AnnotationEvent(Action.CREATED, a);
    }

    public static AnnotationEvent updated(AnnotationResponse a) {
        return new AnnotationEvent(Action.UPDATED, a);
    }

    public static AnnotationEvent deleted(AnnotationResponse a) {
        return new AnnotationEvent(Action.DELETED, a);
    }
}
