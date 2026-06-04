package com.sw.organiflow.modules.kpi.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.department.models.Department;
import com.sw.organiflow.modules.department.repositories.DepartmentRepository;
import com.sw.organiflow.modules.kpi.dtos.KpiAlertDto;
import com.sw.organiflow.modules.kpi.dtos.KpiBatchCalculationRequest;
import com.sw.organiflow.modules.kpi.dtos.KpiCalculationRequest;
import com.sw.organiflow.modules.kpi.dtos.KpiDashboardDto;
import com.sw.organiflow.modules.kpi.dtos.KpiSummaryDto;
import com.sw.organiflow.modules.kpi.enums.KpiPeriod;
import com.sw.organiflow.modules.kpi.models.KpiAlert;
import com.sw.organiflow.modules.kpi.models.KpiDefinition;
import com.sw.organiflow.modules.kpi.models.KpiResult;
import com.sw.organiflow.modules.kpi.repositories.KpiAlertRepository;
import com.sw.organiflow.modules.kpi.repositories.KpiDefinitionRepository;
import com.sw.organiflow.modules.kpi.repositories.KpiResultRepository;
import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiService {

    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiResultRepository kpiResultRepository;
    private final KpiCalculationService kpiCalculationService;
    private final KpiAlertRepository kpiAlertRepository;
    private final WorkflowRepository workflowRepository;
    private final DepartmentRepository departmentRepository;
    private final MongoTemplate mongoTemplate;

    public List<KpiDefinition> getAllDefinitions() {
        return kpiDefinitionRepository.findAll();
    }

    public Optional<KpiDefinition> getDefinitionByCode(String code) {
        return kpiDefinitionRepository.findByCode(code);
    }

    public Page<KpiResult> getResults(String code, Instant from, Instant to, String period,
                                      String workflowId, String departmentId, String userId,
                                      String nodeId, Pageable pageable) {
        String tenantId = TenantContext.getTenantId();

        List<KpiResult> results;
        if (code != null) {
            results = kpiResultRepository.findByTenantIdAndKpiCodeAndPeriodAndCalculatedAtBetween(
                tenantId, code, period, from, to);
        } else {
            results = kpiResultRepository.findByTenantId(tenantId);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), results.size());
        List<KpiResult> pageContent = start <= end ? results.subList(start, end) : new ArrayList<>();

        return new PageImpl<>(pageContent, pageable, results.size());
    }

    public KpiResult calculateKpiOnDemand(KpiCalculationRequest request, String requestedBy) {
        KpiPeriod periodEnum = KpiPeriod.valueOf(request.getPeriod().toUpperCase());
        return kpiCalculationService.calculateKpi(request.getCode(), periodEnum, request.getDimensions(), requestedBy);
    }

    public List<KpiResult> calculateKpisBatch(KpiBatchCalculationRequest request, String requestedBy) {
        List<KpiResult> results = new ArrayList<>();
        KpiPeriod periodEnum = KpiPeriod.valueOf(request.getPeriod().toUpperCase());

        for (String code : request.getCodes()) {
            results.add(kpiCalculationService.calculateKpi(code, periodEnum, request.getDimensions(), requestedBy));
        }
        return results;
    }

    public KpiDashboardDto getDashboard(String tenantId, String periodStr, Integer limit) {
        KpiPeriod period = parsePeriod(periodStr);
        Instant periodEnd = Instant.now();
        Instant periodStart = kpiCalculationService.calculatePeriodStart(period, periodEnd);

        KpiDashboardDto dashboard = new KpiDashboardDto();
        dashboard.setTenantId(tenantId);
        dashboard.setPeriod(period.name().toLowerCase());
        dashboard.setPeriodStart(periodStart);
        dashboard.setPeriodEnd(periodEnd);
        dashboard.setSummary(buildSummary(period, periodEnd));
        dashboard.setTopWorkflows(buildTopWorkflows(tenantId, period, periodEnd, limit));
        dashboard.setTopDepartments(buildTopDepartments(tenantId, period, periodEnd, limit));
        dashboard.setAlerts(buildAlerts(tenantId, periodStart, periodEnd, limit));
        return dashboard;
    }

    private KpiPeriod parsePeriod(String periodStr) {
        try {
            return KpiPeriod.valueOf(periodStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid KPI period '{}', defaulting to weekly", periodStr);
            return KpiPeriod.WEEKLY;
        }
    }

    private Map<String, KpiSummaryDto> buildSummary(KpiPeriod period, Instant periodEnd) {
        Instant previousPeriodEnd = kpiCalculationService.calculatePeriodStart(period, periodEnd);
        Map<String, KpiSummaryDto> summary = new LinkedHashMap<>();

        List<KpiDefinition> definitions = kpiDefinitionRepository.findAll().stream()
            .filter(def -> Boolean.TRUE.equals(def.getIsActive()))
            .sorted(Comparator.comparing(KpiDefinition::getCategory).thenComparing(KpiDefinition::getName))
            .toList();

        for (KpiDefinition definition : definitions) {
            Double currentValue = kpiCalculationService.calculateKpiValue(definition.getCode(), period, null, periodEnd);
            Double previousValue = kpiCalculationService.calculateKpiValue(definition.getCode(), period, null, previousPeriodEnd);
            summary.put(definition.getCode(), new KpiSummaryDto(
                round(currentValue),
                calculateChange(currentValue, previousValue),
                resolveTrend(currentValue, previousValue)
            ));
        }

        return summary;
    }

    private List<Map<String, Object>> buildTopWorkflows(String tenantId, KpiPeriod period, Instant periodEnd, Integer limit) {
        List<Workflow> workflows = workflowRepository.findByTenantId(tenantId);
        List<Map<String, Object>> items = new ArrayList<>();

        for (Workflow workflow : workflows) {
            Map<String, String> dimensions = Map.of("workflowId", workflow.getId());
            long activeCount = countRunningExecutionsByWorkflow(tenantId, workflow.getId());
            long completedCount = countCompletedExecutionsByWorkflow(tenantId, workflow.getId(), period, periodEnd);
            double rate = kpiCalculationService.calculateKpiValue("EXEC_COMPLETION_RATE", period, dimensions, periodEnd);
            long score = activeCount + completedCount;

            if (score == 0) {
                continue;
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", workflow.getId());
            item.put("name", workflow.getName());
            item.put("activeCount", activeCount);
            item.put("completedCount", completedCount);
            item.put("rate", round(rate));
            item.put("score", score);
            items.add(item);
        }

        return items.stream()
            .sorted(Comparator.comparingLong(item -> -((Number) item.get("score")).longValue()))
            .limit(limit)
            .map(this::stripScore)
            .toList();
    }

    private List<Map<String, Object>> buildTopDepartments(String tenantId, KpiPeriod period, Instant periodEnd, Integer limit) {
        List<Department> departments = departmentRepository.findByTenantIdAndIsActiveTrue(tenantId);
        List<Map<String, Object>> items = new ArrayList<>();

        for (Department department : departments) {
            Map<String, String> dimensions = Map.of("departmentId", department.getId());
            long activeCount = Math.round(kpiCalculationService.calculateKpiValue("DEPT_TASK_LOAD", period, dimensions, periodEnd));
            long completedCount = countCompletedTasksByDepartment(tenantId, department.getId(), period, periodEnd);
            double rate = kpiCalculationService.calculateKpiValue("DEPT_SLA_RATE", period, dimensions, periodEnd);
            long score = activeCount + completedCount;

            if (score == 0) {
                continue;
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", department.getId());
            item.put("name", department.getName());
            item.put("activeCount", activeCount);
            item.put("completedCount", completedCount);
            item.put("rate", round(rate));
            item.put("score", score);
            items.add(item);
        }

        return items.stream()
            .sorted(Comparator.comparingLong(item -> -((Number) item.get("score")).longValue()))
            .limit(limit)
            .map(this::stripScore)
            .toList();
    }

    private List<KpiAlertDto> buildAlerts(String tenantId, Instant periodStart, Instant periodEnd, Integer limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return kpiAlertRepository.findByTenantIdAndCreatedAtBetween(tenantId, periodStart, periodEnd, pageable)
            .getContent()
            .stream()
            .map(this::toAlertDto)
            .toList();
    }

    private KpiAlertDto toAlertDto(KpiAlert alert) {
        KpiAlertDto dto = new KpiAlertDto();
        dto.setId(alert.getId());
        dto.setTenantId(alert.getTenantId());
        dto.setKpiCode(alert.getKpiCode());
        dto.setSeverity(alert.getSeverity());
        dto.setValue(alert.getValue());
        dto.setThreshold(alert.getThreshold());
        dto.setMessage(alert.getMessage());
        dto.setIsAcknowledged(alert.getIsAcknowledged());
        dto.setAcknowledgedBy(alert.getAcknowledgedBy());
        dto.setAcknowledgedAt(alert.getAcknowledgedAt());
        dto.setCreatedAt(alert.getCreatedAt());
        return dto;
    }

    private Map<String, Object> stripScore(Map<String, Object> item) {
        Map<String, Object> clean = new LinkedHashMap<>(item);
        clean.remove("score");
        return clean;
    }

    private long countRunningExecutionsByWorkflow(String tenantId, String workflowId) {
        Query query = Query.query(Criteria.where("tenant_id").is(tenantId)
            .and("workflow_id").is(workflowId)
            .and("status").is(ExecutionStatus.RUNNING.name()));
        return mongoTemplate.count(query, "executions");
    }

    private long countCompletedExecutionsByWorkflow(String tenantId, String workflowId, KpiPeriod period, Instant periodEnd) {
        Instant periodStart = kpiCalculationService.calculatePeriodStart(period, periodEnd);
        Query query = Query.query(Criteria.where("tenant_id").is(tenantId)
            .and("workflow_id").is(workflowId)
            .and("status").is(ExecutionStatus.COMPLETED.name())
            .and("completed_at").gte(periodStart).lt(periodEnd));
        return mongoTemplate.count(query, "executions");
    }

    private long countCompletedTasksByDepartment(String tenantId, String departmentId, KpiPeriod period, Instant periodEnd) {
        Instant periodStart = kpiCalculationService.calculatePeriodStart(period, periodEnd);
        Query query = Query.query(Criteria.where("tenant_id").is(tenantId)
            .and("department_id").is(departmentId)
            .and("status").is(TaskStatus.DONE.name())
            .and("completed_at").gte(periodStart).lt(periodEnd));
        return mongoTemplate.count(query, "tasks");
    }

    private Double calculateChange(Double currentValue, Double previousValue) {
        if (previousValue == null || Math.abs(previousValue) < 0.0001) {
            if (currentValue == null || Math.abs(currentValue) < 0.0001) {
                return 0.0;
            }
            return 100.0;
        }

        return round(((currentValue - previousValue) / Math.abs(previousValue)) * 100.0);
    }

    private String resolveTrend(Double currentValue, Double previousValue) {
        double diff = (currentValue != null ? currentValue : 0.0) - (previousValue != null ? previousValue : 0.0);
        if (Math.abs(diff) < 0.0001) {
            return "FLAT";
        }
        return diff > 0 ? "UP" : "DOWN";
    }

    private Double round(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 10.0) / 10.0;
    }
}
