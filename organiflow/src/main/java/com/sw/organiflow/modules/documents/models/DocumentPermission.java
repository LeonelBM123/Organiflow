package com.sw.organiflow.modules.documents.models;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Permiso de un usuario concreto sobre un documento. El usuario debe pertenecer al
 * departamento del nodo al que pertenece el documento (validado al asignar permisos).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentPermission {

    @Field("user_id")
    private String userId;

    @Field("can_view")
    @Builder.Default
    private boolean canView = true;

    @Field("can_edit")
    @Builder.Default
    private boolean canEdit = false;

    @Field("can_comment")
    @Builder.Default
    private boolean canComment = false;

    @Field("can_download")
    @Builder.Default
    private boolean canDownload = true;
}
