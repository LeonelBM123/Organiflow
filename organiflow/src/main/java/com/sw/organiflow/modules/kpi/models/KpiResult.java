package com.sw.organiflow.modules.kpi.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "kpi_results")
@CompoundIndexes({
    @CompoundIndex(name = "idx_result_tenant", def = "{'tenant_id': 1, '_id': 1}"),
    @CompoundIndex(name = "idx_result_tenant_code", def = "{'tenant_id': 1, 'kpi_code': 1}"),
    @CompoundIndex(name = "idx_result_tenant_period", def = "{'tenant_id': 1, 'period': 1, 'calculated_at': 1}"),
    @CompoundIndex(name = "idx_result_workflow", def = "{'tenant_id': 1, 'workflow_id': 1, 'kpi_code': 1}"),
    @CompoundIndex(name = "idx_result_department", def = "{'tenant_id': 1, 'department_id': 1, 'kpi_code': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiResult {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("kpi_code")
    private String kpiCode;

    @Field("kpi_name")
    private String kpiName;

    @Field("calculated_at")
    private Instant calculatedAt;

    @Field("period")
    private String period;                 // "daily", "weekly", "monthly"

    @Field("period_start")
    private Instant periodStart;          // Inicio del período de cálculo

    @Field("period_end")
    private Instant periodEnd;            // Fin del período de cálculo

    @Field("value")
    private Double value;

    @Field("unit")
    private String unit;

    // Segmentación/dimensiones
    @Field("workflow_id")
    private String workflowId;             // null = todas

    @Field("department_id")
    private String departmentId;          // null = todas

    @Field("user_id")
    private String userId;                // null = todas

    @Field("node_id")
    private String nodeId;                // null = todas

    // Metadata
    @Field("sample_size")
    private Long sampleSize;              // Cantidad de registros usados en el cálculo

    @Field("calculated_by")
    private String calculatedBy;         // "scheduler" o userId que solicitó el cálculo

    @Field("created_at")
    private Instant createdAt;
}
