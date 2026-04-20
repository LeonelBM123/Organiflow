package com.sw.organiflow.modules.task.dtos;

import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.modules.workflow.models.FormSchema;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class TaskResponse {

    private String id;
    private String tenantId;
    private String executionId;
    private String workflowId;
    private String nodeId;
    private String nodeName;
    private String assignedUserId;
    private String assignedRole;
    private String departmentId;
    private TaskStatus status;
    private FormSchema formSchema;
    private Map<String, Object> formData;
    private Instant dueAt;
    private Instant completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .tenantId(t.getTenantId())
                .executionId(t.getExecutionId())
                .workflowId(t.getWorkflowId())
                .nodeId(t.getNodeId())
                .nodeName(t.getNodeName())
                .assignedUserId(t.getAssignedUserId())
                .assignedRole(t.getAssignedRole())
                .departmentId(t.getDepartmentId())
                .status(t.getStatus())
                .formSchema(t.getFormSchema())
                .formData(t.getFormData())
                .dueAt(t.getDueAt())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
