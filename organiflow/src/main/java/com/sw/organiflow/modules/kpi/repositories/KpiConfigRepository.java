package com.sw.organiflow.modules.kpi.repositories;

import com.sw.organiflow.modules.kpi.models.KpiConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KpiConfigRepository extends MongoRepository<KpiConfig, String> {
    List<KpiConfig> findByTenantId(String tenantId);
    List<KpiConfig> findByTenantIdAndKpiCodeAndIsActiveTrue(String tenantId, String kpiCode);
}
