package com.sw.organiflow.modules.execution.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExecutionRequest {

    @NotBlank(message = "El workflowId es requerido")
    private String workflowId;
}
