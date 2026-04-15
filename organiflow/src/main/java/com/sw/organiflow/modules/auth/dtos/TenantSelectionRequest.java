package com.sw.organiflow.modules.auth.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TenantSelectionRequest {

    @NotBlank @Email
    private String email;

    @NotBlank
    private String tenantId;
}
