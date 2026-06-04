package com.sw.organiflow.modules.notifications.models;

import com.sw.organiflow.modules.notifications.enums.NotificationPriority;
import com.sw.organiflow.modules.notifications.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "idx_notification_tenant", def = "{'tenant_id': 1, '_id': 1}"),
    @CompoundIndex(name = "idx_notification_user_read", def = "{'user_id': 1, 'read': 1, 'created_at': -1}"),
    @CompoundIndex(name = "idx_notification_entity", def = "{'user_id': 1, 'entity_type': 1, 'entity_id': 1, 'type': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("user_id")
    private String userId;

    @Field("type")
    private NotificationType type;

    @Field("title")
    private String title;

    @Field("message")
    private String message;

    @Field("entity_type")
    private String entityType;

    @Field("entity_id")
    private String entityId;

    @Field("read")
    @Builder.Default
    private Boolean read = false;

    @Field("read_at")
    private Instant readAt;

    @Field("priority")
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.MEDIUM;

    @Field("metadata")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @Field("created_at")
    private Instant createdAt;
}
