package com.sw.organiflow.modules.department.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DepartmentMemberRequest {

    @NotBlank(message = "El userId es requerido")
    private String userId;
}
