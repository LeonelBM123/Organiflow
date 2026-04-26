package com.sw.organiflow.modules.execution.models;

import com.sw.organiflow.shared.audit.AuditDocument;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "executions")
@CompoundIndexes({
        @CompoundIndex(name = "idx_execution_tenant", def = "{'tenant_id': 1, '_id': 1}"),
        @CompoundIndex(name = "idx_execution_tenant_status", def = "{'tenant_id': 1, 'status': 1}"),
        @CompoundIndex(name = "idx_execution_tenant_user", def = "{'tenant_id': 1, 'initiated_by_user_id': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Execution extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("workflow_id")
    private String workflowId;

    @Field("workflow_name")
    private String workflowName;

    @Field("workflow_version")
    private int workflowVersion;

    @Field("initiated_by_user_id")
    private String initiatedByUserId;

    @Field("status")
    @Builder.Default
    private ExecutionStatus status = ExecutionStatus.RUNNING;

    @Field("current_node_ids")
    @Builder.Default
    private List<String> currentNodeIds = new ArrayList<>();

    @Field("execution_nodes")
    @Builder.Default
    private List<ExecutionNode> executionNodes = new ArrayList<>();

    @Field("started_at")
    private Instant startedAt;

    @Field("completed_at")
    private Instant completedAt;

    @Field("global_variables")
    @Builder.Default
    private Map<String, Object> globalVariables = new java.util.HashMap<>();
}
