package com.sw.organiflow.modules.documents.services;

import com.sw.organiflow.modules.documents.dtos.DocumentPermissionDto;
import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.models.DocumentPermission;
import com.sw.organiflow.modules.documents.models.DocumentScope;
import org.springframework.stereotype.Service;

/**
 * Resuelve el permiso efectivo de un usuario sobre un documento.
 *
 * <p>Reglas:
 * <ul>
 *   <li>El rol {@code admin} del tenant siempre tiene acceso total.</li>
 *   <li>Los documentos {@code TEMPLATE} (configuracion del workflow) son visibles y
 *       descargables por cualquier usuario autenticado del tenant; son materiales de
 *       referencia, no documentos sensibles.</li>
 *   <li>Los documentos {@code RUNTIME} solo son accesibles segun los permisos
 *       explicitamente asignados por el admin.</li>
 * </ul>
 * </p>
 */
@Service
public class DocumentPermissionService {

    public static final String ROLE_ADMIN = "admin";

    /** Permiso efectivo del usuario; nunca null (si no tiene nada, todo en false). */
    public DocumentPermissionDto effectiveFor(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) {
            return new DocumentPermissionDto(userId, true, true, true, true);
        }
        // Documentos de plantilla: el usuario siempre puede ver y descargar.
        // Si además tiene permisos explícitos, se usan esos.
        if (doc.getScope() == DocumentScope.TEMPLATE) {
            return doc.getPermissions().stream()
                    .filter(p -> p.getUserId() != null && p.getUserId().equals(userId))
                    .findFirst()
                    .map(DocumentPermissionDto::from)
                    .orElse(new DocumentPermissionDto(userId, true, false, false, true));
        }
        return doc.getPermissions().stream()
                .filter(p -> p.getUserId() != null && p.getUserId().equals(userId))
                .findFirst()
                .map(DocumentPermissionDto::from)
                .orElse(new DocumentPermissionDto(userId, false, false, false, false));
    }

    public boolean canView(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        // Los documentos de plantilla son visibles para todos los usuarios del tenant.
        if (doc.getScope() == DocumentScope.TEMPLATE) return true;
        return matching(doc, userId, DocumentPermission::isCanView);
    }

    public boolean canEdit(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        return matching(doc, userId, DocumentPermission::isCanEdit);
    }

    public boolean canDownload(DocumentAsset doc, String userId, String role) {
        if (isAdmin(role)) return true;
        if (doc.getScope() == DocumentScope.TEMPLATE) return true;
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
