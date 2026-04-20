package com.sw.organiflow.modules.workflow.dtos;

import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.models.WorkflowEdge;
import com.sw.organiflow.modules.workflow.models.WorkflowLane;
import com.sw.organiflow.modules.workflow.models.WorkflowNode;
import com.sw.organiflow.shared.enums.WorkflowStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class WorkflowResponse {

    private String id;
    private String tenantId;
    private String name;
    private String description;
    private WorkflowStatus status;
    private Integer currentVersion;
    private String createdBy;
    private List<WorkflowLane> lanes;
    private List<WorkflowNode> nodes;
    private List<WorkflowEdge> edges;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String uiSchema;

    public static WorkflowResponse from(Workflow w) {
        return WorkflowResponse.builder()
                .id(w.getId())
                .tenantId(w.getTenantId())
                .name(w.getName())
                .description(w.getDescription())
                .status(w.getStatus())
                .currentVersion(w.getCurrentVersion())
                .createdBy(w.getCreatedBy())
                .lanes(w.getLanes())
                .nodes(w.getNodes())
                .edges(w.getEdges())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .uiSchema(w.getUiSchema())
                .build();
    }
}