package com.sw.organiflow.modules.notifications.dto;

import com.sw.organiflow.modules.notifications.models.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListResponse {
    private List<Notification> notifications;
    private long unreadCount;
}
