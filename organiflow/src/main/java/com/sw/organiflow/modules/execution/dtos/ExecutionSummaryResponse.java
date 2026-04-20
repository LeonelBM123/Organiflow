package com.sw.organiflow.modules.execution.dtos;

import com.sw.organiflow.modules.execution.models.Execution;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExecutionSummaryResponse {

    private String id;
    private String workflowId;
    private String workflowName;
    private int workflowVersion;
    private String initiatedByUserId;
    private ExecutionStatus status;
    private List<String> currentNodeIds;
    private Instant startedAt;
    private Instant completedAt;
    private LocalDateTime createdAt;

    public static ExecutionSummaryResponse from(Execution e) {
        return ExecutionSummaryResponse.builder()
                .id(e.getId())
                .workflowId(e.getWorkflowId())
                .workflowName(e.getWorkflowName())
                .workflowVersion(e.getWorkflowVersion())
                .initiatedByUserId(e.getInitiatedByUserId())
                .status(e.getStatus())
                .currentNodeIds(e.getCurrentNodeIds())
                .startedAt(e.getStartedAt())
                .completedAt(e.getCompletedAt())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
