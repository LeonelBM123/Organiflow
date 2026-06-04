package com.sw.organiflow.modules.kpi.models;

import com.sw.organiflow.modules.kpi.enums.KpiCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "kpi_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiDefinition {

    @Id
    private String id;

    @Field("code")
    private String code;                   // "EXEC_AVG_DURATION"

    @Field("name")
    private String name;                  // "Duración promedio de ejecución"

    @Field("description")
    private String description;           // Descripción detallada del KPI

    @Field("category")
    private KpiCategory category;          // EFICIENCIA, PRODUCTIVIDAD, NODO, DEPARTAMENTO, TENDENCIA

    @Field("data_source")
    private String dataSource;            // "execution", "task", "execution_node", "workflow"

    @Field("aggregation_method")
    private String aggregationMethod;     // "AVG", "COUNT", "SUM", "PERCENTILE", "RATE"

    @Field("filter_criteria")
    private Map<String, Object> filterCriteria;  // filtros fijos opcionales

    @Field("dimensions")
    private List<String> dimensions;      // campos por los que se puede segmentar

    @Field("unit")
    private String unit;                  // "hours", "percent", "count", "score"

    @Field("is_active")
    private Boolean isActive;

    @Field("created_at")
    private Instant createdAt;
}
