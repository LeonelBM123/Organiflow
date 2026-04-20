package com.sw.organiflow.modules.collaboration.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DiagramEvent {
    private DiagramEventType eventType;
    private String workflowId;
    private String tenantId;
    private String userId;
    private String userName;
    private String userColor;
    private Object payload;
    private LocalDateTime timestamp;
}
