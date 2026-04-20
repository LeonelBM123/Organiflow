package com.sw.organiflow.modules.workflow.models;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowVersion {
    private Integer versionNumber;
    private List<WorkflowLane> lanes;
    private List<WorkflowNode> nodes;
    private List<WorkflowEdge> edges;
    private String changelog;
    private String createdBy;
    private LocalDateTime createdAt;
}