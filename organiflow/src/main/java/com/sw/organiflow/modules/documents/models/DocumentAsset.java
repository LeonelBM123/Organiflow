package com.sw.organiflow.modules.documents.models;

import com.sw.organiflow.shared.audit.AuditDocument;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

/**
 * Documento (Word/Excel/PPT/PDF/imagen/video) adjunto a un nodo de workflow.
 *
 * <p>Los bytes viven en S3 ({@code s3Key}); aqui solo se guarda la metadata, el control de
 * acceso por usuario ({@code permissions}) y el historial de versiones. Tenant-scoped igual
 * que el resto de documentos del proyecto.</p>
 *
 * <p>Plantillas (scope TEMPLATE) se anclan a {@code workflowId} + {@code nodeId}. Los archivos
 * subidos en ejecucion (scope RUNTIME) ademas referencian {@code executionId} + {@code taskId}.</p>
 */
@Document(collection = "documents")
@CompoundIndexes({
        @CompoundIndex(name = "idx_document_tenant",
                def = "{'tenant_id': 1, '_id': 1}"),
        @CompoundIndex(name = "idx_document_tenant_node",
                def = "{'tenant_id': 1, 'node_id': 1, 'scope': 1}"),
        @CompoundIndex(name = "idx_document_tenant_task",
                def = "{'tenant_id': 1, 'task_id': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAsset extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("workflow_id")
    private String workflowId;

    @Field("node_id")
    private String nodeId;

    /** Departamento del nodo: define quienes pueden recibir permisos. */
    @Field("department_id")
    private String departmentId;

    @Field("execution_id")
    private String executionId;

    @Field("task_id")
    private String taskId;

    @Field("scope")
    private DocumentScope scope;

    @Field("original_name")
    private String originalName;

    @Field("mime_type")
    private String mimeType;

    @Field("category")
    private DocumentCategory category;

    @Field("size_bytes")
    private long sizeBytes;

    /** Clave del objeto actual en S3. */
    @Field("s3_key")
    private String s3Key;

    @Field("current_version")
    @Builder.Default
    private int currentVersion = 1;

    /** Clave logica que OnlyOffice usa para invalidar cache; cambia en cada guardado (fase 2). */
    @Field("document_key")
    private String documentKey;

    @Field("uploaded_by_user_id")
    private String uploadedByUserId;

    @Field("status")
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING_UPLOAD;

    @Field("permissions")
    @Builder.Default
    private List<DocumentPermission> permissions = new ArrayList<>();

    @Field("versions")
    @Builder.Default
    private List<DocumentVersion> versions = new ArrayList<>();
}
