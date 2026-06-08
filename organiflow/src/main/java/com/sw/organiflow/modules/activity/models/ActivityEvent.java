package com.sw.organiflow.modules.activity.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "activity_events")
@CompoundIndexes({
    @CompoundIndex(name = "idx_activity_execution",
        def = "{'tenant_id': 1, 'execution_id': 1, 'occurred_at': 1}"),
    @CompoundIndex(name = "idx_activity_document",
        def = "{'tenant_id': 1, 'document_id': 1, 'occurred_at': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEvent {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("execution_id")
    private String executionId;

    @Field("document_id")
    private String documentId;

    @Field("actor_user_id")
    private String actorUserId;

    @Field("actor_name")
    private String actorName;

    @Field("event_type")
    private ActivityEventType eventType;

    @Field("entity_type")
    private String entityType;

    @Field("entity_id")
    private String entityId;

    @Field("metadata")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @Field("occurred_at")
    private Instant occurredAt;
}
