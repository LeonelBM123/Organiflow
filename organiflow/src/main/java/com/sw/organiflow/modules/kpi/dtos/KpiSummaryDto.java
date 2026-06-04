package com.sw.organiflow.modules.kpi.dtos;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiSummaryDto {
    private Double value;
    private Double change; // Diferencia con periodo anterior
    private String trend; // "UP", "DOWN", "FLAT"
}
