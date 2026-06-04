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
import java.util.List;

@Document(collection = "kpi_configs")
@CompoundIndexes({
    @CompoundIndex(name = "idx_config_tenant", def = "{'tenant_id': 1, '_id': 1}"),
    @CompoundIndex(name = "idx_config_tenant_code", def = "{'tenant_id': 1, 'kpi_code': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiConfig {

    @Id
    private String id;

    @Field("tenant_id")
    private String tenantId;

    @Field("kpi_code")
    private String kpiCode;

    @Field("period")
    private String period;                // "daily", "weekly", "monthly"

    @Field("threshold_warning")
    private Double thresholdWarning;      // Valor que dispara warning (verde→amarillo)

    @Field("threshold_critical")
    private Double thresholdCritical;     // Valor que dispara alerta crítica (amarillo→rojo)

    @Field("comparison_operator")
    private String comparisonOperator;     // "GT" (mayor que), "LT" (menor que), "EQ" (igual)

    @Field("is_active")
    private Boolean isActive;

    @Field("alert_channels")
    private List<String> alertChannels;   // "EMAIL", "WEBSOCKET", "DASHBOARD", "PUSH"

    @Field("notification_role")
    private String notificationRole;      // Rol que recibe la notificación (ej: "ADMIN")

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;
}
