package com.sw.organiflow.modules.task.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.department.models.Department;
import com.sw.organiflow.modules.department.repositories.DepartmentRepository;
import com.sw.organiflow.modules.execution.services.ExecutionService;
import com.sw.organiflow.modules.notifications.repositories.UserDeviceRepository;
import com.sw.organiflow.modules.notifications.services.PushNotificationService;
import com.sw.organiflow.modules.task.dtos.TaskCompleteRequest;
import com.sw.organiflow.modules.task.dtos.TaskResponse;
import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.modules.task.repositories.TaskRepository;
import com.sw.organiflow.modules.workflow.models.FormField;
import com.sw.organiflow.modules.workflow.models.FormSchema;
import com.sw.organiflow.modules.workflow.models.WorkflowNode;
import com.sw.organiflow.security.util.SecurityUtils;
import com.sw.organiflow.shared.enums.NodeType;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final PushNotificationService pushNotificationService;
    private final UserDeviceRepository userDeviceRepository;
    private final ExecutionService executionService;
    private final DepartmentRepository departmentRepository;

    @Autowired
    public TaskService(TaskRepository taskRepository,
                       PushNotificationService pushNotificationService,
                       UserDeviceRepository userDeviceRepository,
                       @Lazy ExecutionService executionService,
                       DepartmentRepository departmentRepository) {
        this.taskRepository = taskRepository;
        this.pushNotificationService = pushNotificationService;
        this.userDeviceRepository = userDeviceRepository;
        this.executionService = executionService;
        this.departmentRepository = departmentRepository;
    }

    public Task createFromNode(String tenantId, String executionId, String workflowId,
                               WorkflowNode node) {
        if (node.getType() != NodeType.TASK && node.getType() != NodeType.ITERATOR) {
            return null;
        }

        Instant dueAt = node.getTimeoutHours() != null
                ? Instant.now().plusSeconds(node.getTimeoutHours() * 3600L)
                : null;

        Task task = Task.builder()
                .tenantId(tenantId)
                .executionId(executionId)
                .workflowId(workflowId)
                .nodeId(node.getId())
                .nodeName(node.getName())
                .departmentId(node.getDepartmentId())
                .assignedUserId(node.getAssignedUserId())
                .status(TaskStatus.PENDING)
                .formSchema(node.getFormSchema())
                .dueAt(dueAt)
                .build();

        Task saved = taskRepository.save(task);
        log.info("Tarea creada: {} para nodo: {} en ejecución: {}", saved.getId(), node.getId(), executionId);

        notifyAssignedUser(saved);
        return saved;
    }

    public List<TaskResponse> findMine() {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();

        List<Task> byUser = taskRepository.findByTenantIdAndAssignedUserId(tenantId, userId);

        List<String> deptIds = departmentRepository
                .findByTenantIdAndMemberUserIdsContaining(tenantId, userId)
                .stream().map(Department::getId).toList();

        List<Task> byDept = deptIds.isEmpty() ? List.of()
                : taskRepository.findByTenantIdAndDepartmentIdIn(tenantId, deptIds)
                        .stream().filter(t -> t.getAssignedUserId() == null).toList();

        List<Task> combined = new ArrayList<>(byUser);
        combined.addAll(byDept);
        return combined.stream().map(TaskResponse::from).toList();
    }

    public TaskResponse findById(String id) {
        return TaskResponse.from(findByIdAndTenant(id));
    }

    public TaskResponse start(String id) {
        Task task = findByIdAndTenant(id);

        if (task.getStatus() != TaskStatus.PENDING) {
            throw new RuntimeException("La tarea no está en estado PENDING");
        }

        String userId = SecurityUtils.getCurrentUserId();
        task.setStatus(TaskStatus.IN_PROGRESS);
        task.setAssignedUserId(userId);

        Task saved = taskRepository.save(task);
        log.info("Tarea {} tomada por usuario {}", id, userId);
        return TaskResponse.from(saved);
    }

    public TaskResponse complete(String id, TaskCompleteRequest request) {
        Task task = findByIdAndTenant(id);

        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw new RuntimeException("La tarea no está en estado IN_PROGRESS");
        }

        validateFormData(task.getFormSchema(), request.getFormData());

        task.setStatus(TaskStatus.DONE);
        task.setFormData(request.getFormData());
        task.setCompletedAt(Instant.now());

        Task saved = taskRepository.save(task);
        log.info("Tarea {} completada", id);

        executionService.advance(task.getExecutionId(), task.getNodeId(), request.getFormData());

        return TaskResponse.from(saved);
    }

    public TaskResponse escalate(String id) {
        Task task = findByIdAndTenant(id);

        if (task.getStatus() == TaskStatus.DONE || task.getStatus() == TaskStatus.SKIPPED) {
            throw new RuntimeException("No se puede escalar una tarea ya finalizada");
        }

        task.setStatus(TaskStatus.ESCALATED);
        Task saved = taskRepository.save(task);
        log.info("Tarea {} escalada", id);
        return TaskResponse.from(saved);
    }

    public List<TaskResponse> findByExecution(String executionId) {
        String tenantId = TenantContext.getTenantId();
        return taskRepository.findByTenantIdAndExecutionId(tenantId, executionId)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    private void validateFormData(FormSchema schema, Map<String, Object> formData) {
        if (schema == null || schema.getFields() == null) return;
        if (formData == null) formData = Map.of();

        for (FormField field : schema.getFields()) {
            if (field.isRequired()) {
                Object value = formData.get(field.getName());
                if (value == null || value.toString().isBlank()) {
                    throw new RuntimeException(
                            "El campo '" + field.getLabel() + "' es requerido");
                }
            }
        }
    }

    private void notifyAssignedUser(Task task) {
        if (task.getAssignedUserId() != null) {
            userDeviceRepository.findByUserId(task.getAssignedUserId())
                    .forEach(device -> pushNotificationService.sendPushNotificationToDevice(
                            device.getFcmToken(),
                            "Nueva tarea asignada",
                            "Tienes una nueva tarea: " + task.getNodeName()
                    ));
        } else if (task.getDepartmentId() != null) {
            departmentRepository.findById(task.getDepartmentId()).ifPresent(dept ->
                dept.getMemberUserIds().forEach(memberId ->
                    userDeviceRepository.findByUserId(memberId)
                            .forEach(device -> pushNotificationService.sendPushNotificationToDevice(
                                    device.getFcmToken(),
                                    "Nueva tarea disponible",
                                    "Hay una nueva tarea para tu departamento: " + task.getNodeName()
                            ))
                )
            );
        }
    }

    private Task findByIdAndTenant(String id) {
        String tenantId = TenantContext.getTenantId();
        return taskRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "Tarea no encontrada o no pertenece a tu empresa"));
    }
}
