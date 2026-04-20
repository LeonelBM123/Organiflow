package com.sw.organiflow.modules.workflow.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WorkflowRequest {
    @NotBlank(message = "El nombre es requerido")
    private String name;

    private String description;
}
