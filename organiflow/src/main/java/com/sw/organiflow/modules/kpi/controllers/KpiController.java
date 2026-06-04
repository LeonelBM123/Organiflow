package com.sw.organiflow.modules.kpi.controllers;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.kpi.dtos.KpiBatchCalculationRequest;
import com.sw.organiflow.modules.kpi.dtos.KpiCalculationRequest;
import com.sw.organiflow.modules.kpi.dtos.KpiDashboardDto;
import com.sw.organiflow.modules.kpi.models.KpiAlert;
import com.sw.organiflow.modules.kpi.models.KpiConfig;
import com.sw.organiflow.modules.kpi.models.KpiDefinition;
import com.sw.organiflow.modules.kpi.models.KpiResult;
import com.sw.organiflow.modules.kpi.repositories.KpiAlertRepository;
import com.sw.organiflow.modules.kpi.repositories.KpiConfigRepository;
import com.sw.organiflow.modules.kpi.services.KpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/kpis")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService kpiService;
    private final KpiConfigRepository kpiConfigRepository;
    private final KpiAlertRepository kpiAlertRepository;

    @GetMapping("/definitions")
    public ResponseEntity<List<KpiDefinition>> getDefinitions() {
        return ResponseEntity.ok(kpiService.getAllDefinitions());
    }

    @GetMapping("/definitions/{code}")
    public ResponseEntity<KpiDefinition> getDefinitionByCode(@PathVariable String code) {
        return kpiService.getDefinitionByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/results")
    public ResponseEntity<Page<KpiResult>> getResults(
            @RequestParam(required = false) String code,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String nodeId,
            Pageable pageable) {

        Instant fromInstant = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        Page<KpiResult> results = kpiService.getResults(code, fromInstant, toInstant, period,
                workflowId, departmentId, userId, nodeId, pageable);

        return ResponseEntity.ok(results);
    }

    @PostMapping("/calculate")
    public ResponseEntity<KpiResult> calculateKpi(@RequestBody KpiCalculationRequest request) {
        // En un caso real, el "requestedBy" se sacaría del SecurityContext
        String requestedBy = "current_user"; 
        return ResponseEntity.ok(kpiService.calculateKpiOnDemand(request, requestedBy));
    }

    @PostMapping("/calculate/batch")
    public ResponseEntity<List<KpiResult>> calculateKpisBatch(@RequestBody KpiBatchCalculationRequest request) {
        String requestedBy = "current_user";
        return ResponseEntity.ok(kpiService.calculateKpisBatch(request, requestedBy));
    }

    @GetMapping("/dashboard/{tenantId}")
    public ResponseEntity<KpiDashboardDto> getDashboard(
            @PathVariable String tenantId,
            @RequestParam(defaultValue = "weekly") String period,
            @RequestParam(defaultValue = "5") Integer limit) {

        // Validación de seguridad: el usuario actual pertenece a este tenant?
        if (!tenantId.equals(TenantContext.getTenantId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(kpiService.getDashboard(tenantId, period, limit));
    }

    // Configs
    @GetMapping("/configs")
    public ResponseEntity<List<KpiConfig>> getConfigs() {
        return ResponseEntity.ok(kpiConfigRepository.findByTenantId(TenantContext.getTenantId()));
    }

    @GetMapping("/configs/{id}")
    public ResponseEntity<KpiConfig> getConfigById(@PathVariable String id) {
        return kpiConfigRepository.findById(id)
                .filter(c -> c.getTenantId().equals(TenantContext.getTenantId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/configs")
    public ResponseEntity<KpiConfig> createConfig(@RequestBody KpiConfig config) {
        config.setTenantId(TenantContext.getTenantId());
        config.setCreatedAt(Instant.now());
        config.setUpdatedAt(Instant.now());
        config.setIsActive(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiConfigRepository.save(config));
    }

    @PutMapping("/configs/{id}")
    public ResponseEntity<KpiConfig> updateConfig(@PathVariable String id, @RequestBody KpiConfig configUpdate) {
        return kpiConfigRepository.findById(id)
                .filter(c -> c.getTenantId().equals(TenantContext.getTenantId()))
                .map(existing -> {
                    existing.setThresholdWarning(configUpdate.getThresholdWarning());
                    existing.setThresholdCritical(configUpdate.getThresholdCritical());
                    existing.setComparisonOperator(configUpdate.getComparisonOperator());
                    existing.setAlertChannels(configUpdate.getAlertChannels());
                    existing.setNotificationRole(configUpdate.getNotificationRole());
                    existing.setUpdatedAt(Instant.now());
                    return ResponseEntity.ok(kpiConfigRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable String id) {
        return kpiConfigRepository.findById(id)
                .filter(c -> c.getTenantId().equals(TenantContext.getTenantId()))
                .map(existing -> {
                    existing.setIsActive(false);
                    existing.setUpdatedAt(Instant.now());
                    kpiConfigRepository.save(existing);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Alerts
    @GetMapping("/alerts")
    public ResponseEntity<Page<KpiAlert>> getAlerts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) Boolean acknowledged,
            Pageable pageable) {
        
        // Simplificado: idealmente se crea una Specification/Criteria para múltiples filtros opcionales
        Page<KpiAlert> alerts;
        String tenantId = TenantContext.getTenantId();
        
        if (from == null) from = Instant.EPOCH;
        if (to == null) to = Instant.now();
        
        if (acknowledged != null) {
            alerts = kpiAlertRepository.findByTenantIdAndIsAcknowledgedAndCreatedAtBetween(
                tenantId, acknowledged, from, to, pageable);
        } else {
            alerts = kpiAlertRepository.findByTenantIdAndCreatedAtBetween(tenantId, from, to, pageable);
        }
        
        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<KpiAlert> acknowledgeAlert(@PathVariable String id) {
        return kpiAlertRepository.findById(id)
                .filter(a -> a.getTenantId().equals(TenantContext.getTenantId()))
                .map(existing -> {
                    existing.setIsAcknowledged(true);
                    existing.setAcknowledgedBy("current_user");
                    existing.setAcknowledgedAt(Instant.now());
                    return ResponseEntity.ok(kpiAlertRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
