package com.sw.organiflow.modules.notifications.dto;

import com.sw.organiflow.modules.notifications.enums.NotificationPriority;
import com.sw.organiflow.modules.notifications.enums.NotificationType;
import com.sw.organiflow.modules.notifications.models.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private String entityType;
    private String entityId;
    private Boolean read;
    private NotificationPriority priority;
    private Map<String, Object> metadata;
    private Instant timestamp;

    public static NotificationEvent from(Notification notification) {
        return NotificationEvent.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .entityType(notification.getEntityType())
            .entityId(notification.getEntityId())
            .read(notification.getRead())
            .priority(notification.getPriority())
            .metadata(notification.getMetadata())
            .timestamp(notification.getCreatedAt())
            .build();
    }
}
