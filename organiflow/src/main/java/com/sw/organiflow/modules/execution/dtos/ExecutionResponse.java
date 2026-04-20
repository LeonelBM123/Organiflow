package com.sw.organiflow.modules.execution.dtos;

import com.sw.organiflow.modules.execution.models.Execution;
import com.sw.organiflow.modules.execution.models.ExecutionNode;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExecutionResponse {

    private String id;
    private String tenantId;
    private String workflowId;
    private String workflowName;
    private int workflowVersion;
    private String initiatedByUserId;
    private ExecutionStatus status;
    private List<String> currentNodeIds;
    private List<ExecutionNode> executionNodes;
    private Instant startedAt;
    private Instant completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ExecutionResponse from(Execution e) {
        return ExecutionResponse.builder()
                .id(e.getId())
                .tenantId(e.getTenantId())
                .workflowId(e.getWorkflowId())
                .workflowName(e.getWorkflowName())
                .workflowVersion(e.getWorkflowVersion())
                .initiatedByUserId(e.getInitiatedByUserId())
                .status(e.getStatus())
                .currentNodeIds(e.getCurrentNodeIds())
                .executionNodes(e.getExecutionNodes())
                .startedAt(e.getStartedAt())
                .completedAt(e.getCompletedAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
