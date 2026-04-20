package com.sw.organiflow.modules.workflow.dtos;

import lombok.Data;

@Data
public class WorkflowPublishRequest {
    private String changelog; // descripción de los cambios en esta versión
}