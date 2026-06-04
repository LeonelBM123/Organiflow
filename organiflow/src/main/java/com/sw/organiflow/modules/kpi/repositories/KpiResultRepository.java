package com.sw.organiflow.modules.kpi.repositories;

import com.sw.organiflow.modules.kpi.models.KpiResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface KpiResultRepository extends MongoRepository<KpiResult, String> {

    List<KpiResult> findByTenantId(String tenantId);

    List<KpiResult> findByTenantIdAndKpiCode(String tenantId, String kpiCode);

    List<KpiResult> findByTenantIdAndKpiCodeAndPeriod(String tenantId, String kpiCode, String period);

    List<KpiResult> findByTenantIdAndKpiCodeAndPeriodAndCalculatedAtBetween(
        String tenantId, String kpiCode, String period, Instant from, Instant to);

    List<KpiResult> findByTenantIdAndWorkflowIdAndCalculatedAtBetween(
        String tenantId, String workflowId, Instant from, Instant to);

    List<KpiResult> findByTenantIdAndDepartmentIdAndCalculatedAtBetween(
        String tenantId, String departmentId, Instant from, Instant to);

    @Query("{ 'tenant_id': ?0, 'period': ?1, 'calculated_at': { $lt: ?2 } }")
    void deleteOldResults(String tenantId, String period, Instant cutoffDate);

    // Para cleanup
    @Query("{ 'tenant_id': ?0, 'period': 'daily', 'calculated_at': { $lt: ?1 } }")
    List<KpiResult> findDailyOldByTenant(String tenantId, Instant cutoff);

    @Query("{ 'tenant_id': ?0, 'period': 'weekly', 'calculated_at': { $lt: ?1 } }")
    List<KpiResult> findWeeklyOldByTenant(String tenantId, Instant cutoff);

    @Query("{ 'tenant_id': ?0, 'period': 'monthly', 'calculated_at': { $lt: ?1 } }")
    List<KpiResult> findMonthlyOldByTenant(String tenantId, Instant cutoff);
}
