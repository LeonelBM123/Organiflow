package com.sw.organiflow.modules.notifications.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.department.models.Department;
import com.sw.organiflow.modules.department.repositories.DepartmentRepository;
import com.sw.organiflow.modules.execution.models.Execution;
import com.sw.organiflow.modules.notifications.dto.NotificationEvent;
import com.sw.organiflow.modules.notifications.dto.NotificationListResponse;
import com.sw.organiflow.modules.notifications.dto.TestNotificationRequest;
import com.sw.organiflow.modules.notifications.enums.NotificationPriority;
import com.sw.organiflow.modules.notifications.enums.NotificationType;
import com.sw.organiflow.modules.notifications.models.Notification;
import com.sw.organiflow.modules.notifications.models.UserDevice;
import com.sw.organiflow.modules.notifications.repositories.NotificationRepository;
import com.sw.organiflow.modules.notifications.repositories.UserDeviceRepository;
import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String USER_NOTIFICATIONS_DESTINATION = "/queue/notifications";
    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

    private final NotificationRepository notificationRepository;
    private final UserDeviceRepository userDeviceRepository;
    private final PushNotificationService pushNotificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final DepartmentRepository departmentRepository;
    public void notifyTaskAssigned(Task task) {
        if (task.getAssignedUserId() != null && !task.getAssignedUserId().isBlank()) {
            createAndDispatch(
                task.getTenantId(),
                task.getAssignedUserId(),
                NotificationType.TASK_ASSIGNED,
                "Nueva tarea asignada",
                "Se te asigno la tarea '" + safe(task.getNodeName()) + "'.",
                "task",
                task.getId(),
                NotificationPriority.MEDIUM,
                taskMetadata(task)
            );
            return;
        }

        if (task.getDepartmentId() == null || task.getDepartmentId().isBlank()) {
            return;
        }

        departmentRepository.findById(task.getDepartmentId())
            .map(Department::getMemberUserIds)
            .stream()
            .flatMap(List::stream)
            .distinct()
            .forEach(memberId -> createAndDispatch(
                task.getTenantId(),
                memberId,
                NotificationType.TASK_ASSIGNED,
                "Nueva tarea disponible",
                "Hay una nueva tarea disponible para tu departamento: '" + safe(task.getNodeName()) + "'.",
                "task",
                task.getId(),
                NotificationPriority.MEDIUM,
                taskMetadata(task)
            ));
    }

    /** Avisa a un usuario que el admin le compartió (dio permiso sobre) un documento. */
    public void notifyDocumentShared(String tenantId, String userId, String documentId, String documentName) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("documentId", documentId);

        createAndDispatch(
            tenantId,
            userId,
            NotificationType.DOCUMENT_SHARED,
            "Te compartieron un documento",
            "Tienes acceso al documento '" + safe(documentName) + "'.",
            "document",
            documentId,
            NotificationPriority.MEDIUM,
            metadata
        );
    }

    public void notifyTaskCompleted(Task task, String completedByUserId) {
        if (task.getAssignedUserId() == null || task.getAssignedUserId().isBlank()) {
            return;
        }

        Map<String, Object> metadata = taskMetadata(task);
        metadata.put("completedByUserId", completedByUserId);

        createAndDispatch(
            task.getTenantId(),
            task.getAssignedUserId(),
            NotificationType.TASK_COMPLETED,
            "Tarea completada",
            "La tarea '" + safe(task.getNodeName()) + "' fue completada.",
            "task",
            task.getId(),
            NotificationPriority.LOW,
            metadata
        );
    }

    public void notifyTaskDueSoon(Task task) {
        if (task.getAssignedUserId() == null || task.getAssignedUserId().isBlank()) {
            return;
        }

        if (hasUnreadNotification(task.getTenantId(), task.getAssignedUserId(), NotificationType.TASK_DUE_SOON, "task", task.getId())) {
            return;
        }

        createAndDispatch(
            task.getTenantId(),
            task.getAssignedUserId(),
            NotificationType.TASK_DUE_SOON,
            "Tarea proxima a vencer",
            "La tarea '" + safe(task.getNodeName()) + "' vence pronto" + dueAtSuffix(task.getDueAt()) + ".",
            "task",
            task.getId(),
            NotificationPriority.HIGH,
            taskMetadata(task)
        );
    }

    public void notifyTaskOverdue(Task task) {
        if (task.getAssignedUserId() == null || task.getAssignedUserId().isBlank()) {
            return;
        }

        if (hasUnreadNotification(task.getTenantId(), task.getAssignedUserId(), NotificationType.TASK_OVERDUE, "task", task.getId())) {
            return;
        }

        createAndDispatch(
            task.getTenantId(),
            task.getAssignedUserId(),
            NotificationType.TASK_OVERDUE,
            "Tarea vencida",
            "La tarea '" + safe(task.getNodeName()) + "' ya vencio" + dueAtSuffix(task.getDueAt()) + ".",
            "task",
            task.getId(),
            NotificationPriority.URGENT,
            taskMetadata(task)
        );
    }

    public void notifyExecutionStarted(Execution execution) {
        if (execution.getInitiatedByUserId() == null || execution.getInitiatedByUserId().isBlank()) {
            return;
        }

        createAndDispatch(
            execution.getTenantId(),
            execution.getInitiatedByUserId(),
            NotificationType.EXECUTION_STARTED,
            "Ejecucion iniciada",
            "Se inicio una nueva ejecucion del workflow '" + safe(execution.getWorkflowName()) + "'.",
            "execution",
            execution.getId(),
            NotificationPriority.MEDIUM,
            executionMetadata(execution)
        );
    }

    public void notifyExecutionCompleted(Execution execution) {
        if (execution.getInitiatedByUserId() == null || execution.getInitiatedByUserId().isBlank()) {
            return;
        }

        createAndDispatch(
            execution.getTenantId(),
            execution.getInitiatedByUserId(),
            NotificationType.EXECUTION_COMPLETED,
            "Ejecucion completada",
            "La ejecucion del workflow '" + safe(execution.getWorkflowName()) + "' finalizo correctamente.",
            "execution",
            execution.getId(),
            NotificationPriority.MEDIUM,
            executionMetadata(execution)
        );
    }

    public void notifyExecutionCanceled(Execution execution) {
        if (execution.getInitiatedByUserId() == null || execution.getInitiatedByUserId().isBlank()) {
            return;
        }

        createAndDispatch(
            execution.getTenantId(),
            execution.getInitiatedByUserId(),
            NotificationType.EXECUTION_CANCELED,
            "Ejecucion cancelada",
            "La ejecucion del workflow '" + safe(execution.getWorkflowName()) + "' fue cancelada.",
            "execution",
            execution.getId(),
            NotificationPriority.HIGH,
            executionMetadata(execution)
        );
    }

    public NotificationListResponse getMyNotifications(int limit) {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();
        int safeLimit = Math.max(1, Math.min(limit, 100));

        List<Notification> notifications = notificationRepository
            .findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId)
            .stream()
            .limit(safeLimit)
            .toList();

        return NotificationListResponse.builder()
            .notifications(notifications)
            .unreadCount(notificationRepository.countByTenantIdAndUserIdAndReadFalse(tenantId, userId))
            .build();
    }

    public List<Notification> getMyUnreadNotifications() {
        return notificationRepository.findTop20ByTenantIdAndUserIdAndReadFalseOrderByCreatedAtDesc(
            TenantContext.getTenantId(),
            SecurityUtils.getCurrentUserId()
        );
    }

    public long getMyUnreadCount() {
        return notificationRepository.countByTenantIdAndUserIdAndReadFalse(
            TenantContext.getTenantId(),
            SecurityUtils.getCurrentUserId()
        );
    }

    public Notification markAsRead(String notificationId) {
        Notification notification = notificationRepository.findByIdAndTenantIdAndUserId(
                notificationId, TenantContext.getTenantId(), SecurityUtils.getCurrentUserId())
            .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));

        if (Boolean.TRUE.equals(notification.getRead())) {
            return notification;
        }

        notification.setRead(true);
        notification.setReadAt(Instant.now());
        Notification saved = notificationRepository.save(notification);
        pushUnreadCount(saved.getUserId(), saved.getTenantId());
        return saved;
    }

    public long markAllAsRead() {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();

        List<Notification> unread = notificationRepository
            .findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId)
            .stream()
            .filter(notification -> !Boolean.TRUE.equals(notification.getRead()))
            .toList();

        unread.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        });

        notificationRepository.saveAll(unread);
        pushUnreadCount(userId, tenantId);
        return unread.size();
    }

    public long cleanupOldNotifications(Instant cutoff) {
        return notificationRepository.deleteByCreatedAtBefore(cutoff);
    }

    public Notification createTestNotificationForCurrentUser(TestNotificationRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();

        Map<String, Object> metadata = new HashMap<>();
        if (request != null && request.getMetadata() != null) {
            metadata.putAll(request.getMetadata());
        }
        if (request != null && request.getRoute() != null && !request.getRoute().isBlank()) {
            metadata.put("route", request.getRoute());
        }

        return createAndDispatch(
            tenantId,
            userId,
            request != null && request.getType() != null ? request.getType() : NotificationType.SYSTEM_ALERT,
            request != null && request.getTitle() != null && !request.getTitle().isBlank()
                ? request.getTitle()
                : "Notificacion de prueba",
            request != null && request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage()
                : "Esta es una notificacion de prueba para validar FCM y la bandeja movil.",
            request != null && request.getEntityType() != null && !request.getEntityType().isBlank()
                ? request.getEntityType()
                : "system",
            request != null && request.getEntityId() != null && !request.getEntityId().isBlank()
                ? request.getEntityId()
                : "test",
            request != null && request.getPriority() != null ? request.getPriority() : NotificationPriority.MEDIUM,
            metadata
        );
    }

    private Notification createAndDispatch(String tenantId,
                                           String userId,
                                           NotificationType type,
                                           String title,
                                           String message,
                                           String entityType,
                                           String entityId,
                                           NotificationPriority priority,
                                           Map<String, Object> metadata) {
        Notification notification = Notification.builder()
            .tenantId(tenantId)
            .userId(userId)
            .type(type)
            .title(title)
            .message(message)
            .entityType(entityType)
            .entityId(entityId)
            .priority(priority)
            .metadata(metadata != null ? metadata : new HashMap<>())
            .createdAt(Instant.now())
            .build();

        Notification saved = notificationRepository.save(notification);
        NotificationEvent event = NotificationEvent.from(saved);

        messagingTemplate.convertAndSendToUser(userId, USER_NOTIFICATIONS_DESTINATION, event);
        pushUnreadCount(userId, tenantId);
        sendPushIfRegistered(saved);

        log.info("Notification dispatched: type={}, userId={}, entityType={}, entityId={}",
            type, userId, entityType, entityId);
        return saved;
    }

    private void pushUnreadCount(String userId, String tenantId) {
        long unreadCount = notificationRepository.countByTenantIdAndUserIdAndReadFalse(tenantId, userId);
        messagingTemplate.convertAndSendToUser(userId, USER_NOTIFICATIONS_DESTINATION + "/count", Map.of(
            "unreadCount", unreadCount
        ));
    }

    private void sendPushIfRegistered(Notification notification) {
        Map<String, Object> payload = buildPushPayload(notification);
        String userId = notification.getUserId();
        List<UserDevice> devices = userDeviceRepository.findByUserId(userId);
        for (UserDevice device : devices) {
            pushNotificationService.sendPushNotificationToDevice(
                device.getFcmToken(),
                notification.getTitle(),
                notification.getMessage(),
                payload
            );
        }
    }

    private Map<String, Object> buildPushPayload(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        if (notification.getMetadata() != null) {
            payload.putAll(notification.getMetadata());
        }

        payload.put("notificationId", notification.getId());
        payload.put("type", notification.getType().name());
        payload.put("entityType", notification.getEntityType());
        payload.put("entityId", notification.getEntityId());
        payload.putIfAbsent("route", resolveRoute(notification));

        return payload.entrySet().stream()
            .filter(entry -> entry.getKey() != null && entry.getValue() != null)
            .collect(HashMap::new, (map, entry) -> map.put(entry.getKey(), entry.getValue()), HashMap::putAll);
    }

    private String resolveRoute(Notification notification) {
        Object explicitRoute = notification.getMetadata() != null ? notification.getMetadata().get("route") : null;
        if (explicitRoute instanceof String route && !route.isBlank()) {
            return route;
        }

        String entityId = notification.getEntityId();
        return switch (Objects.toString(notification.getEntityType(), "")) {
            case "task" -> entityId != null && !entityId.isBlank()
                ? "/task-form?taskId=" + entityId
                : "/notifications";
            case "execution" -> "/execution-history";
            case "workflow" -> "/admin-workflows";
            case "document" -> "/documents";
            default -> "/notifications";
        };
    }

    private boolean hasUnreadNotification(String tenantId, String userId, NotificationType type, String entityType, String entityId) {
        return notificationRepository.existsByTenantIdAndUserIdAndTypeAndEntityTypeAndEntityIdAndReadFalse(
            tenantId, userId, type, entityType, entityId
        );
    }

    private Map<String, Object> taskMetadata(Task task) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("workflowId", task.getWorkflowId());
        metadata.put("executionId", task.getExecutionId());
        metadata.put("departmentId", task.getDepartmentId());
        metadata.put("nodeId", task.getNodeId());
        metadata.put("nodeName", task.getNodeName());
        if (task.getDueAt() != null) {
            metadata.put("dueAt", task.getDueAt().toString());
        }
        return metadata;
    }

    private Map<String, Object> executionMetadata(Execution execution) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("workflowId", execution.getWorkflowId());
        metadata.put("workflowName", execution.getWorkflowName());
        metadata.put("workflowVersion", execution.getWorkflowVersion());
        metadata.put("status", execution.getStatus().name());
        return metadata;
    }

    private String dueAtSuffix(Instant dueAt) {
        return dueAt == null ? "" : " (" + DATE_FORMATTER.format(dueAt) + ")";
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "sin nombre" : value;
    }

}
