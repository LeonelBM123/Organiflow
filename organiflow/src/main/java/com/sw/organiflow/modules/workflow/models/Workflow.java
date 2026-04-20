package com.sw.organiflow.modules.workflow.models;

import com.sw.organiflow.shared.audit.AuditDocument;
import com.sw.organiflow.shared.enums.WorkflowStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "workflows")
@CompoundIndexes({
        @CompoundIndex(name = "idx_workflow_tenant",
                def = "{'tenant_id': 1, '_id': 1}"),
        @CompoundIndex(name = "idx_workflow_tenant_status",
                def = "{'tenant_id': 1, 'status': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Workflow extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("name")
    private String name;

    @Field("description")
    private String description;

    @Field("status")
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.DRAFT;

    @Field("current_version")
    @Builder.Default
    private Integer currentVersion = 0;

    @Field("created_by")
    private String createdBy;

    // El grafo en vivo — lo que está en el canvas ahora mismo
    @Field("lanes")
    @Builder.Default
    private List<WorkflowLane> lanes = new ArrayList<>();

    @Field("nodes")
    @Builder.Default
    private List<WorkflowNode> nodes = new ArrayList<>();

    @Field("edges")
    @Builder.Default
    private List<WorkflowEdge> edges = new ArrayList<>();

    @Field("ui_schema")
    private String uiSchema;
    
    // Historial de versiones publicadas
    @Field("versions")
    @Builder.Default
    private List<WorkflowVersion> versions = new ArrayList<>();
}