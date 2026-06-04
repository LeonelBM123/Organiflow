package com.sw.organiflow.modules.kpi.repositories;

import com.sw.organiflow.modules.kpi.models.KpiAlert;
import com.sw.organiflow.modules.kpi.enums.AlertSeverity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface KpiAlertRepository extends MongoRepository<KpiAlert, String> {
    Page<KpiAlert> findByTenantIdAndCreatedAtBetween(String tenantId, Instant from, Instant to, Pageable pageable);
    Page<KpiAlert> findByTenantIdAndSeverityAndCreatedAtBetween(String tenantId, AlertSeverity severity, Instant from, Instant to, Pageable pageable);
    Page<KpiAlert> findByTenantIdAndIsAcknowledgedAndCreatedAtBetween(String tenantId, Boolean isAcknowledged, Instant from, Instant to, Pageable pageable);
    Page<KpiAlert> findByTenantIdAndSeverityAndIsAcknowledgedAndCreatedAtBetween(String tenantId, AlertSeverity severity, Boolean isAcknowledged, Instant from, Instant to, Pageable pageable);
}
