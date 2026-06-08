package com.sw.organiflow.modules.documents.models;

import com.sw.organiflow.shared.audit.AuditDocument;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * Anotación colaborativa sobre un documento (fase 3): un trazo de dibujo libre sobre un PDF
 * ({@link AnnotationType#DRAWING}) o un comentario de texto sobre PDF/imagen/video
 * ({@link AnnotationType#COMMENT}).
 *
 * <p>Vive en su propia colección, referenciando {@code documentId}. Tenant-scoped como el resto.
 * Las escrituras se difunden por WebSocket a {@code /topic/document.{tenantId}.{documentId}}.</p>
 */
@Document(collection = "document_annotations")
@CompoundIndex(name = "idx_annotation_tenant_document", def = "{'tenant_id': 1, 'document_id': 1}")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnnotation extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("document_id")
    private String documentId;

    @Field("type")
    private AnnotationType type;

    /** Página (1-based) para anotaciones de PDF; {@code null} en imágenes/video. */
    @Field("page")
    private Integer page;

    /** Geometría del trazo serializada como JSON (solo {@link AnnotationType#DRAWING}). */
    @Field("geometry")
    private String geometry;

    /** Color del trazo (solo DRAWING). */
    @Field("color")
    private String color;

    /** Grosor del trazo (solo DRAWING). */
    @Field("stroke_width")
    private Double strokeWidth;

    /** Texto del comentario (solo {@link AnnotationType#COMMENT}). */
    @Field("text")
    private String text;

    @Field("author_user_id")
    private String authorUserId;

    /** Nombre del autor, denormalizado para mostrar sin resolver el usuario en el front. */
    @Field("author_name")
    private String authorName;
}
