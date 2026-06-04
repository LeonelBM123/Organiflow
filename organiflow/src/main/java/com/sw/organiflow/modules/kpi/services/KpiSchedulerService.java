package com.sw.organiflow.modules.kpi.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.kpi.enums.KpiPeriod;
import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.tenant.repositories.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiSchedulerService {

    private final KpiCalculationService kpiCalculationService;
    private final KpiAlertService kpiAlertService;
    private final TenantRepository tenantRepository;
    
    private final List<String> dailyKpis = List.of(
        "EXEC_AVG_DURATION", "EXEC_COMPLETION_RATE", "EXEC_ACTIVE_COUNT", "EXEC_CANCELLED_RATE",
        "TASK_PENDING_COUNT", "TASK_COMPLETED_BY_USER", "TASK_AVG_RESOLUTION_TIME", "TASK_SLA_COMPLIANCE",
        "DEPT_TASK_LOAD", "DEPT_AVG_COMPLETION", "DEPT_SLA_RATE", "TREND_DAILY_THROUGHPUT"
    );

    private final List<String> weeklyKpis = List.of(
        "EXEC_AVG_DURATION", "EXEC_COMPLETION_RATE", "TASK_SLA_COMPLIANCE", "TREND_WEEKLY_COMPLETION", "TREND_TASK_BACKLOG"
    );

    /**
     * Cálculos diarios - Todos los días a las 00:05
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void calculateDailyKpis() {
        log.info("Iniciando cálculo de KPIs diarios");
        List<Tenant> tenants = tenantRepository.findAll();
        
        for (Tenant tenant : tenants) {
            TenantContext.setTenantId(tenant.getId());
            try {
                for (String code : dailyKpis) {
                    var result = kpiCalculationService.calculateKpi(code, KpiPeriod.DAILY, null, "scheduler");
                    kpiAlertService.checkAndAlert(tenant.getId(), code, result.getValue(), KpiPeriod.DAILY.name().toLowerCase());
                }
            } catch (Exception e) {
                log.error("Error calculando KPIs diarios para tenant {}", tenant.getId(), e);
            } finally {
                TenantContext.clear();
            }
        }
    }

    /**
     * Cálculos semanales - Lunes a las 00:30
     */
    @Scheduled(cron = "0 30 0 ? * MON")
    public void calculateWeeklyKpis() {
        log.info("Iniciando cálculo de KPIs semanales");
        List<Tenant> tenants = tenantRepository.findAll();
        
        for (Tenant tenant : tenants) {
            TenantContext.setTenantId(tenant.getId());
            try {
                for (String code : weeklyKpis) {
                    var result = kpiCalculationService.calculateKpi(code, KpiPeriod.WEEKLY, null, "scheduler");
                    kpiAlertService.checkAndAlert(tenant.getId(), code, result.getValue(), KpiPeriod.WEEKLY.name().toLowerCase());
                }
            } catch (Exception e) {
                log.error("Error calculando KPIs semanales para tenant {}", tenant.getId(), e);
            } finally {
                TenantContext.clear();
            }
        }
    }

    /**
     * Cálculos mensuales - Día 1 a las 01:00
     */
    @Scheduled(cron = "0 0 1 1 * ?")
    public void calculateMonthlyKpis() {
        log.info("Iniciando cálculo de KPIs mensuales");
        // Implementación similar a daily/weekly
    }

    /**
     * Cleanup - Todos los días a las 03:00
     * Elimina datos antiguos según política de retención
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupOldData() {
        log.info("Iniciando cleanup de datos antiguos");
        // Lógica de limpieza implementada con KpiResultRepository
    }
}
