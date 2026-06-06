package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.user.models.User;

/** Usuario candidato a recibir permisos: miembro del departamento del nodo. */
public record PermissionCandidateResponse(
        String userId,
        String name,
        String email
) {
    public static PermissionCandidateResponse from(User u) {
        return new PermissionCandidateResponse(u.getId(), u.getName(), u.getEmail());
    }
}
