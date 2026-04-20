package com.sw.organiflow.modules.workflow.models;

import com.sw.organiflow.shared.enums.EdgeType;
import lombok.*;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowEdge {

    private String id;
    private String sourceId;
    private String targetId;
    private String sourcePortId;
    private String targetPortId;
    private EdgeType relationType;
    private String label;
    private ConditionRule conditionRule;    // solo si es CONDITIONAL
    private Integer priority;               // orden si hay múltiples salidas
    private Map<String, Object> style;      // Syncfusion
}