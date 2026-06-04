package com.sw.organiflow.modules.notifications.dto;

import com.sw.organiflow.modules.notifications.enums.NotificationPriority;
import com.sw.organiflow.modules.notifications.enums.NotificationType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class TestNotificationRequest {

    @Size(max = 120)
    private String title;

    @Size(max = 300)
    private String message;

    private NotificationType type;

    private NotificationPriority priority;

    private String entityType;

    private String entityId;

    private String route;

    private Map<String, Object> metadata;
}
