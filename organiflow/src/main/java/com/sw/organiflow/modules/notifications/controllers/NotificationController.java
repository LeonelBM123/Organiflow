package com.sw.organiflow.modules.notifications.controllers;

import com.sw.organiflow.modules.notifications.dto.NotificationListResponse;
import com.sw.organiflow.modules.notifications.dto.TestNotificationRequest;
import com.sw.organiflow.modules.notifications.models.Notification;
import com.sw.organiflow.modules.notifications.services.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<NotificationListResponse> getMyNotifications(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(notificationService.getMyNotifications(limit));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications());
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.getMyUnreadCount()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Long>> markAllAsRead() {
        return ResponseEntity.ok(Map.of("updated", notificationService.markAllAsRead()));
    }

    @PostMapping("/test")
    public ResponseEntity<Notification> sendTestNotification(@Valid @RequestBody(required = false) TestNotificationRequest request) {
        return ResponseEntity.ok(notificationService.createTestNotificationForCurrentUser(request));
    }
}
