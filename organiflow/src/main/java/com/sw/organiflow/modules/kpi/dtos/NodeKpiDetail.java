package com.sw.organiflow.modules.kpi.dtos;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class NodeKpiDetail {
    private String nodeId;
    private String nodeName;
    private String nodeType;
    private String workflowId;
    private String workflowName;
}
