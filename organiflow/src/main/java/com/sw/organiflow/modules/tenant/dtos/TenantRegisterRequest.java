package com.sw.organiflow.modules.tenant.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TenantRegisterRequest {

    @NotBlank(message = "El nombre es requerido")
    private String name;

    @NotBlank(message = "El slug es requerido")
    @Size(min = 3, max = 50)
    @Pattern(
            regexp = "^[a-z0-9-]+$",
            message = "El slug solo puede tener letras minúsculas, números y guiones"
    )
    private String slug;

    // Datos del admin que crea la empresa
    @NotBlank(message = "El nombre del admin es requerido")
    private String adminName;

    @NotBlank(message = "El email del admin es requerido")
    private String adminEmail;

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 8)
    private String adminPassword;
}