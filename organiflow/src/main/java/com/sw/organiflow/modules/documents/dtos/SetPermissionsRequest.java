package com.sw.organiflow.modules.documents.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Reemplaza la lista completa de permisos por usuario de un documento. */
public record SetPermissionsRequest(
        @NotNull @Valid List<DocumentPermissionDto> permissions
) {}
