package com.sw.organiflow.modules.kpi.dtos;

import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
public class KpiDashboardDto {
    private String tenantId;
    private String period;
    private Instant periodStart;
    private Instant periodEnd;
    private Map<String, KpiSummaryDto> summary;
    private List<Map<String, Object>> topWorkflows;
    private List<Map<String, Object>> topDepartments;
    private List<KpiAlertDto> alerts;
}
