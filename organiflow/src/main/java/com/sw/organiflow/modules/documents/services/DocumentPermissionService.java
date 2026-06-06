package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.documents.dtos.DocumentPermissionDto;
import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.models.DocumentPermission;
import org.springframework.stereotype.Service;

/**
 * Resuelve el permiso efectivo de un usuario sobre un documento.
 *
 * <p>Regla: el rol {@code admin} del tenant siempre tiene acceso total. Cualquier otro usuario
 * solo tiene los permisos que figuren explicitamente en la lista del documento (asignados por
 * el admin entre los miembros del departamento del nodo).</p>
 */
@Service
public class DocumentPermissionService {

    public static final String ROLE_ADMIN = "admin";

    /** Permiso efectivo del usuario; nunca null (si no tiene nada, todo en false). */
    public DocumentPermissionDto effectiveFor(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) {
            return new DocumentPermissionDto(userId, true, true, true, true);
        }
        return doc.getPermissions().stream()
                .filter(p -> p.getUserId() != null && p.getUserId().equals(userId))
                .findFirst()
                .map(DocumentPermissionDto::from)
                .orElse(new DocumentPermissionDto(userId, false, false, false, false));
    }

    public boolean canView(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        return matching(doc, userId, DocumentPermission::isCanView);
    }

    public boolean canEdit(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        return matching(doc, userId, DocumentPermission::isCanEdit);
    }

    public boolean canDownload(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        return matching(doc, userId, DocumentPermission::isCanDownload);
    }

    public boolean canComment(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        return matching(doc, userId, DocumentPermission::isCanComment);
    }

    public boolean isAdmin(String role) {
        return ROLE_ADMIN.equalsIgnoreCase(role);
    }

    private boolean matching(DocumentAsset doc, String userId,
                             java.util.function.Predicate<DocumentPermission> flag) {
        return doc.getPermissions().stream()
                .filter(p -> p.getUserId() != null && p.getUserId().equals(userId))
                .anyMatch(flag);
    }
}
