package com.sw.organiflow.modules.execution.models;

import com.sw.organiflow.shared.enums.NodeType;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionNode {

    @Field("node_id")
    private String nodeId;

    @Field("node_name")
    private String nodeName;

    @Field("node_type")
    private NodeType nodeType;

    @Field("status")
    @Builder.Default
    private TaskStatus status = TaskStatus.PENDING;

    @Field("assigned_user_id")
    private String assignedUserId;

    @Field("started_at")
    private Instant startedAt;

    @Field("completed_at")
    private Instant completedAt;

    @Field("form_data")
    private Map<String, Object> formData;
}
