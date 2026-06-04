package com.sw.organiflow.modules.kpi.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.kpi.enums.KpiPeriod;
import com.sw.organiflow.modules.kpi.models.KpiResult;
import com.sw.organiflow.modules.kpi.repositories.KpiResultRepository;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import com.sw.organiflow.shared.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiCalculationService {

    private final MongoTemplate mongoTemplate;
    private final KpiResultRepository kpiResultRepository;

    public KpiResult calculateKpi(String code, KpiPeriod period, Map<String, String> dimensions, String requestedBy) {
        Instant periodEnd = Instant.now();
        Instant periodStart = calculatePeriodStart(period, periodEnd);
        String tenantId = TenantContext.getTenantId();
        Double value = calculateKpiValue(code, tenantId, periodStart, periodEnd, dimensions);
        return saveResult(code, value, tenantId, period, periodStart, periodEnd, dimensions, requestedBy);
    }

    public Double calculateKpiValue(String code, KpiPeriod period, Map<String, String> dimensions) {
        return calculateKpiValue(code, period, dimensions, Instant.now());
    }

    public Double calculateKpiValue(String code, KpiPeriod period, Map<String, String> dimensions, Instant periodEnd) {
        String tenantId = TenantContext.getTenantId();
        Instant periodStart = calculatePeriodStart(period, periodEnd);
        return calculateKpiValue(code, tenantId, periodStart, periodEnd, dimensions);
    }

    public Instant calculatePeriodStart(KpiPeriod period, Instant end) {
        return switch (period) {
            case DAILY -> end.minus(1, ChronoUnit.DAYS);
            case WEEKLY -> end.minus(7, ChronoUnit.DAYS);
            case MONTHLY -> end.minus(30, ChronoUnit.DAYS);
            case YEARLY -> end.minus(365, ChronoUnit.DAYS);
        };
    }

    private Double calculateKpiValue(String code, String tenantId, Instant periodStart, Instant periodEnd,
                                     Map<String, String> dimensions) {
        return switch (code) {
            case "EXEC_AVG_DURATION" -> calculateExecAvgDurationAggregation(tenantId, periodStart, periodEnd, dimensions);
            case "EXEC_COMPLETION_RATE" -> calculateExecCompletionRate(tenantId, periodStart, periodEnd, dimensions);
            case "EXEC_ACTIVE_COUNT" -> calculateExecActiveCount(tenantId, dimensions);
            case "EXEC_CANCELLED_RATE" -> calculateExecCancelledRate(tenantId, periodStart, periodEnd, dimensions);
            case "TASK_PENDING_COUNT" -> calculateTaskPendingCount(tenantId, dimensions);
            case "TASK_COMPLETED_BY_USER" -> calculateTaskCompletedByUser(tenantId, periodStart, periodEnd, dimensions);
            case "TASK_AVG_RESOLUTION_TIME" -> calculateTaskAvgResolutionTime(tenantId, periodStart, periodEnd, dimensions);
            case "TASK_SLA_COMPLIANCE" -> calculateTaskSlaCompliance(tenantId, periodStart, periodEnd, dimensions);
            case "TASK_OVERDUE_RATE" -> calculateTaskOverdueRate(tenantId, periodStart, periodEnd, dimensions);
            case "NODE_SKIP_RATE" -> calculateNodeSkipRate(tenantId, periodStart, periodEnd, dimensions);
            case "DEPT_TASK_LOAD" -> calculateDeptTaskLoad(tenantId, dimensions);
            case "DEPT_AVG_COMPLETION" -> calculateDeptAvgCompletion(tenantId, periodStart, periodEnd, dimensions);
            case "DEPT_SLA_RATE" -> calculateDeptSlaRate(tenantId, periodStart, periodEnd, dimensions);
            case "TREND_DAILY_THROUGHPUT" -> calculateTrendDailyThroughput(tenantId, periodStart, periodEnd);
            case "TREND_WEEKLY_COMPLETION" -> calculateTrendWeeklyCompletion(tenantId, periodStart, periodEnd);
            case "TREND_TASK_BACKLOG" -> calculateTrendTaskBacklog(tenantId);
            default -> 0.0;
        };
    }

    private KpiResult saveResult(String code, Double value, String tenantId, KpiPeriod period,
                                 Instant start, Instant end, Map<String, String> dimensions, String requestedBy) {
        KpiResult result = KpiResult.builder()
            .tenantId(tenantId)
            .kpiCode(code)
            .calculatedAt(Instant.now())
            .period(period.name().toLowerCase())
            .periodStart(start)
            .periodEnd(end)
            .value(value)
            .calculatedBy(requestedBy)
            .workflowId(dimensions != null ? dimensions.get("workflowId") : null)
            .departmentId(dimensions != null ? dimensions.get("departmentId") : null)
            .userId(dimensions != null ? dimensions.get("userId") : null)
            .nodeId(dimensions != null ? dimensions.get("nodeId") : null)
            .createdAt(Instant.now())
            .build();

        return kpiResultRepository.save(result);
    }

    private Double calculateExecAvgDurationAggregation(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(ExecutionStatus.COMPLETED.name())
            .and("completed_at").gte(start).lt(end);

        if (dims != null && dims.containsKey("workflowId")) {
            criteria = criteria.and("workflow_id").is(dims.get("workflowId"));
        }

        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(criteria),
            Aggregation.addFields()
                .addField("durationMillis")
                .withValue(ArithmeticOperators.Subtract.valueOf("completed_at").subtract("started_at"))
                .build(),
            Aggregation.group()
                .avg("durationMillis").as("avgDuration")
        );

        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, "executions", Map.class);
        Map result = results.getUniqueMappedResult();
        if (result == null || result.get("avgDuration") == null) {
            return 0.0;
        }

        Double avgMillis = ((Number) result.get("avgDuration")).doubleValue();
        return avgMillis / (1000.0 * 60.0 * 60.0);
    }

    private Double calculateExecCompletionRate(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("started_at").gte(start).lt(end);

        if (dims != null && dims.containsKey("workflowId")) {
            criteria = criteria.and("workflow_id").is(dims.get("workflowId"));
        }

        long total = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        if (total == 0) {
            return 0.0;
        }

        criteria.and("status").is(ExecutionStatus.COMPLETED.name());
        long completed = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        return (completed * 100.0) / total;
    }

    private Double calculateExecActiveCount(String tenantId, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(ExecutionStatus.RUNNING.name());

        if (dims != null && dims.containsKey("workflowId")) {
            criteria = criteria.and("workflow_id").is(dims.get("workflowId"));
        }

        long count = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        return (double) count;
    }

    private Double calculateExecCancelledRate(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("started_at").gte(start).lt(end);

        if (dims != null && dims.containsKey("workflowId")) {
            criteria = criteria.and("workflow_id").is(dims.get("workflowId"));
        }

        long total = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        if (total == 0) {
            return 0.0;
        }

        criteria.and("status").is(ExecutionStatus.CANCELED.name());
        long canceled = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        return (canceled * 100.0) / total;
    }

    private Double calculateTaskPendingCount(String tenantId, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").in(TaskStatus.PENDING.name(), TaskStatus.IN_PROGRESS.name());

        if (dims != null && dims.containsKey("departmentId")) {
            criteria = criteria.and("department_id").is(dims.get("departmentId"));
        }

        long count = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "tasks");
        return (double) count;
    }

    private Double calculateTaskCompletedByUser(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(TaskStatus.DONE.name())
            .and("completed_at").gte(start).lt(end);

        if (dims != null && dims.containsKey("userId")) {
            criteria = criteria.and("assigned_user_id").is(dims.get("userId"));
        }

        long count = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "tasks");
        return (double) count;
    }

    private Double calculateTaskAvgResolutionTime(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(TaskStatus.DONE.name())
            .and("completed_at").gte(start).lt(end);

        if (dims != null && dims.containsKey("departmentId")) {
            criteria = criteria.and("department_id").is(dims.get("departmentId"));
        }

        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(criteria),
            Aggregation.addFields()
                .addField("durationMillis")
                .withValue(ArithmeticOperators.Subtract.valueOf("completed_at").subtract("created_at"))
                .build(),
            Aggregation.group()
                .avg("durationMillis").as("avgDuration")
        );

        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, "tasks", Map.class);
        Map result = results.getUniqueMappedResult();
        if (result == null || result.get("avgDuration") == null) {
            return 0.0;
        }

        Double avgMillis = ((Number) result.get("avgDuration")).doubleValue();
        return avgMillis / (1000.0 * 60.0 * 60.0);
    }

    private Double calculateTaskSlaCompliance(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Criteria baseCriteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(TaskStatus.DONE.name())
            .and("completed_at").gte(start).lt(end)
            .and("due_at").ne(null);

        if (dims != null && dims.containsKey("departmentId")) {
            baseCriteria = baseCriteria.and("department_id").is(dims.get("departmentId"));
        }
        if (dims != null && dims.containsKey("userId")) {
            baseCriteria = baseCriteria.and("assigned_user_id").is(dims.get("userId"));
        }

        long total = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(baseCriteria), "tasks");
        if (total == 0) {
            return 0.0;
        }

        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(baseCriteria),
            Aggregation.project("completed_at", "due_at")
                .andExpression("completed_at <= due_at").as("onTime"),
            Aggregation.match(Criteria.where("onTime").is(true)),
            Aggregation.count().as("onTimeCount")
        );

        AggregationResults<Map> results = mongoTemplate.aggregate(aggregation, "tasks", Map.class);
        Map result = results.getUniqueMappedResult();
        long onTimeCount = 0;
        if (result != null && result.get("onTimeCount") != null) {
            onTimeCount = ((Number) result.get("onTimeCount")).longValue();
        }

        return (onTimeCount * 100.0) / total;
    }

    private Double calculateTaskOverdueRate(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        Double slaCompliance = calculateTaskSlaCompliance(tenantId, start, end, dims);
        Criteria baseCriteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(TaskStatus.DONE.name())
            .and("completed_at").gte(start).lt(end)
            .and("due_at").ne(null);

        long total = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(baseCriteria), "tasks");
        if (total == 0) {
            return 0.0;
        }

        return 100.0 - slaCompliance;
    }

    private Double calculateNodeSkipRate(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        return 0.0;
    }

    private Double calculateDeptTaskLoad(String tenantId, Map<String, String> dims) {
        return calculateTaskPendingCount(tenantId, dims);
    }

    private Double calculateDeptAvgCompletion(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        return calculateTaskAvgResolutionTime(tenantId, start, end, dims);
    }

    private Double calculateDeptSlaRate(String tenantId, Instant start, Instant end, Map<String, String> dims) {
        return calculateTaskSlaCompliance(tenantId, start, end, dims);
    }

    private Double calculateTrendDailyThroughput(String tenantId, Instant start, Instant end) {
        Criteria criteria = Criteria.where("tenant_id").is(tenantId)
            .and("status").is(ExecutionStatus.COMPLETED.name())
            .and("completed_at").gte(start).lt(end);
        long count = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(criteria), "executions");
        return (double) count;
    }

    private Double calculateTrendWeeklyCompletion(String tenantId, Instant start, Instant end) {
        return calculateTrendDailyThroughput(tenantId, start, end);
    }

    private Double calculateTrendTaskBacklog(String tenantId) {
        return calculateTaskPendingCount(tenantId, null);
    }

    public Map<String, Double> calculateNodeDurations(String tenantId, Instant start, Instant end) {
        return new HashMap<>();
    }
}
