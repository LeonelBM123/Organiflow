package com.sw.organiflow.modules.documents.models;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * Version historica de un documento. Cada guardado de la co-edicion Office (fase 2) agrega
 * una nueva version apuntando a su propia clave en S3.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersion {

    @Field("version_number")
    private int versionNumber;

    @Field("s3_key")
    private String s3Key;

    @Field("size_bytes")
    private long sizeBytes;

    @Field("saved_by_user_id")
    private String savedByUserId;

    @Field("saved_at")
    private LocalDateTime savedAt;

    @Field("comment")
    private String comment;
}
