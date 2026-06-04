package com.sw.organiflow.modules.kpi.models;

import com.sw.organiflow.modules.kpi.enums.AlertSeverity;
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

@Document(collection = "kpi_alerts")
@CompoundIndexes({
    @CompoundIndex(name = "idx_alert_tenant", def = "{'tenant_id': 1, '_id': 1}"),
    @CompoundIndex(name = "idx_alert_tenant_code", def = "{'tenant_id': 1, 'kpi_code': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiAlert {

    @Id
    private String id;
    
    @Field("tenant_id")
    private String tenantId;
    
    @Field("kpi_code")
    private String kpiCode;
    
    @Field("severity")
    private AlertSeverity severity;
    
    @Field("value")
    private Double value;
    
    @Field("threshold")
    private Double threshold;
    
    @Field("message")
    private String message;
    
    @Field("is_acknowledged")
    @Builder.Default
    private Boolean isAcknowledged = false;
    
    @Field("acknowledged_by")
    private String acknowledgedBy;
    
    @Field("acknowledged_at")
    private Instant acknowledgedAt;
    
    @Field("created_at")
    private Instant createdAt;
}
