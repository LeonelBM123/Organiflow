package com.sw.organiflow.modules.collaboration.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;

@Data
@Builder
@Document(collection = "diagram_sessions")
public class DiagramSession {

    @Id
    private String id;

    @Field("workflow_id")
    private String workflowId;

    @Field("tenant_id")
    private String tenantId;

    @Field("user_id")
    private String userId;

    @Field("user_name")
    private String userName;

    @Field("user_color")
    private String userColor;

    @Field("cursor_x")
    private Double cursorX;

    @Field("cursor_y")
    private Double cursorY;

    @Field("selected_node_id")
    private String selectedNodeId;

    @Field("last_seen")
    private Date lastSeen;
}
