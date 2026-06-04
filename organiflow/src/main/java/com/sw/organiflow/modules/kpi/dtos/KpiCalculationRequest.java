package com.sw.organiflow.modules.kpi.dtos;

import lombok.Data;
import java.util.Map;

@Data
public class KpiCalculationRequest {
    private String code;
    private String period; // "daily", "weekly", "monthly", "yearly"
    private Map<String, String> dimensions;
}
