package com.sw.organiflow.modules.collaboration.dto;

import java.time.LocalDateTime;

public record DiagramSyncResponse(
        String workflowId,
        String uiSchema,
        String lastUpdatedBy,
        LocalDateTime lastUpdatedAt
) {}
