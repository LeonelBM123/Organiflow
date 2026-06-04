package com.sw.organiflow.modules.kpi.dtos;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class KpiBatchCalculationRequest {
    private List<String> codes;
    private String period;
    private Map<String, String> dimensions;
}
