package com.sw.organiflow.modules.user.dtos;

import com.sw.organiflow.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @NotBlank(message = "El nombre es requerido")
    private String name;

    @NotBlank(message = "El email es requerido")
    @Email(message = "El email no es válido")
    private String email;

    @NotNull(message = "El role es requerido")
    private UserRole role;

    @NotNull(message = "El estado es requerido")
    private Boolean active;
}
