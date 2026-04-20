package com.sw.organiflow.modules.department.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentRequest {

    @NotBlank(message = "El nombre es requerido")
    private String name;

    private String description;

    private String headUserId;
}
