package com.sw.organiflow.modules.documents.dtos;

import com.sw.organiflow.modules.documents.models.DocumentPermission;
import jakarta.validation.constraints.NotBlank;

/** Permiso de un usuario sobre un documento (request y response). */
public record DocumentPermissionDto(
        @NotBlank String userId,
        boolean canView,
        boolean canEdit,
        boolean canComment,
        boolean canDownload
) {
    public static DocumentPermissionDto from(DocumentPermission p) {
        return new DocumentPermissionDto(
                p.getUserId(), p.isCanView(), p.isCanEdit(), p.isCanComment(), p.isCanDownload());
    }

    public DocumentPermission toModel() {
        return DocumentPermission.builder()
                .userId(userId)
                .canView(canView)
                .canEdit(canEdit)
                .canComment(canComment)
                .canDownload(canDownload)
                .build();
    }
}
