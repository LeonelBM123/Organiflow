package com.sw.organiflow.modules.task.models;

import com.sw.organiflow.modules.workflow.models.FormSchema;
import com.sw.organiflow.shared.audit.AuditDocument;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

@Document(collection = "tasks")
@CompoundIndexes({
        @CompoundIndex(name = "idx_task_tenant", def = "{'tenant_id': 1, '_id': 1}"),
        @CompoundIndex(name = "idx_task_tenant_status", def = "{'tenant_id': 1, 'status': 1}"),
        @CompoundIndex(name = "idx_task_tenant_user", def = "{'tenant_id': 1, 'assigned_user_id': 1}"),
        @CompoundIndex(name = "idx_task_execution", def = "{'tenant_id': 1, 'execution_id': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task extends AuditDocument {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("execution_id")
    private String executionId;

    @Field("workflow_id")
    private String workflowId;

    @Field("node_id")
    private String nodeId;

    @Field("node_name")
    private String nodeName;

    @Field("assigned_user_id")
    private String assignedUserId;

    @Field("assigned_role")
    private String assignedRole;

    @Field("department_id")
    private String departmentId;

    @Field("status")
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    @Field("form_schema")
    private FormSchema formSchema;

    @Field("form_data")
    private Map<String, Object> formData;

    @Field("due_at")
    private Instant dueAt;

    @Field("completed_at")
    private Instant completedAt;
}
