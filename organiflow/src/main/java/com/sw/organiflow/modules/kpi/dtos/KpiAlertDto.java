package com.sw.organiflow.modules.kpi.dtos;

import com.sw.organiflow.modules.kpi.enums.AlertSeverity;
import lombok.Data;
import java.time.Instant;

@Data
public class KpiAlertDto {
    private String id;
    private String tenantId;
    private String kpiCode;
    private AlertSeverity severity;
    private Double value;
    private Double threshold;
    private String message;
    private Boolean isAcknowledged;
    private String acknowledgedBy;
    private Instant acknowledgedAt;
    private Instant createdAt;
}
