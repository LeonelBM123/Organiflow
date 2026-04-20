package com.sw.organiflow.modules.workflow.dtos;

import com.sw.organiflow.modules.workflow.models.WorkflowEdge;
import com.sw.organiflow.modules.workflow.models.WorkflowLane;
import com.sw.organiflow.modules.workflow.models.WorkflowNode;
import lombok.Data;

import java.util.List;

@Data
public class WorkflowSaveRequest {
    private List<WorkflowLane> lanes;
    private List<WorkflowNode> nodes;
    private List<WorkflowEdge> edges;
    private String uiSchema;
}