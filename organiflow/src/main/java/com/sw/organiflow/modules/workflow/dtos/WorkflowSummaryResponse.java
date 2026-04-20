package com.sw.organiflow.modules.workflow.dtos;

import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.shared.enums.WorkflowStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WorkflowSummaryResponse {

    private String id;
    private String name;
    private String description;
    private WorkflowStatus status;
    private Integer currentVersion;
    private int totalNodes;
    private int totalLanes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WorkflowSummaryResponse from(Workflow w) {
        return WorkflowSummaryResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .status(w.getStatus())
                .currentVersion(w.getCurrentVersion())
                .totalNodes(w.getNodes() != null ? w.getNodes().size() : 0)
                .totalLanes(w.getLanes() != null ? w.getLanes().size() : 0)
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}