package com.sw.organiflow.modules.kpi.services;

import com.sw.organiflow.modules.kpi.enums.AlertSeverity;
import com.sw.organiflow.modules.kpi.models.KpiAlert;
import com.sw.organiflow.modules.kpi.models.KpiConfig;
import com.sw.organiflow.modules.kpi.repositories.KpiAlertRepository;
import com.sw.organiflow.modules.kpi.repositories.KpiConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiAlertService {

    private final KpiConfigRepository kpiConfigRepository;
    private final KpiAlertRepository kpiAlertRepository;

    public void checkAndAlert(String tenantId, String kpiCode, Double value, String period) {
        List<KpiConfig> configs = kpiConfigRepository
            .findByTenantIdAndKpiCodeAndIsActiveTrue(tenantId, kpiCode);

        for (KpiConfig config : configs) {
            if (config.getPeriod().equals(period) || config.getPeriod().equals("all")) {
                AlertSeverity severity = evaluateSeverity(value, config);
                if (severity != null) {
                    saveAndDispatchAlert(tenantId, kpiCode, value, severity, config);
                }
            }
        }
    }

    private AlertSeverity evaluateSeverity(Double value, KpiConfig config) {
        if (value == null) return null;
        
        boolean isCritical = evaluateOperator(value, config.getThresholdCritical(), config.getComparisonOperator());
        if (isCritical) return AlertSeverity.CRITICAL;
        
        boolean isWarning = evaluateOperator(value, config.getThresholdWarning(), config.getComparisonOperator());
        if (isWarning) return AlertSeverity.WARNING;
        
        return null;
    }
    
    private boolean evaluateOperator(Double value, Double threshold, String operator) {
        if (threshold == null || operator == null) return false;
        return switch (operator) {
            case "GT" -> value > threshold;
            case "LT" -> value < threshold;
            case "EQ" -> value.equals(threshold);
            default -> false;
        };
    }

    private void saveAndDispatchAlert(String tenantId, String kpiCode, Double value,
                          AlertSeverity severity, KpiConfig config) {
                          
        String message = String.format("KPI %s threshold exceeded: %.2f (Threshold: %.2f)", 
            kpiCode, value, severity == AlertSeverity.CRITICAL ? config.getThresholdCritical() : config.getThresholdWarning());
            
        KpiAlert alert = KpiAlert.builder()
            .tenantId(tenantId)
            .kpiCode(kpiCode)
            .severity(severity)
            .value(value)
            .threshold(severity == AlertSeverity.CRITICAL ? config.getThresholdCritical() : config.getThresholdWarning())
            .message(message)
            .isAcknowledged(false)
            .createdAt(Instant.now())
            .build();
            
        kpiAlertRepository.save(alert);
        
        log.warn("KPI Alert Generated: {}", message);
        
        // Aquí se integrarían las notificaciones posteriormente
        // notificationService.sendKpiAlert(...)
    }
}
