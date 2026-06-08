package com.sw.organiflow.modules.activity.dtos;

import com.sw.organiflow.modules.activity.models.ActivityEvent;

import java.util.Map;

public record ActivityEventResponse(
        String id,
        String executionId,
        String documentId,
        String actorUserId,
        String actorName,
        String eventType,
        String entityType,
        String entityId,
        Map<String, Object> metadata,
        String occurredAt
) {
    public static ActivityEventResponse from(ActivityEvent e) {
        return new ActivityEventResponse(
                e.getId(),
                e.getExecutionId(),
                e.getDocumentId(),
                e.getActorUserId(),
                e.getActorName(),
                e.getEventType() != null ? e.getEventType().name() : null,
                e.getEntityType(),
                e.getEntityId(),
                e.getMetadata(),
                e.getOccurredAt() != null ? e.getOccurredAt().toString() : null
        );
    }
}
