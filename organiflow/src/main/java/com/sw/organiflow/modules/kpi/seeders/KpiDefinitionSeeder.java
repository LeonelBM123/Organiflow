package com.sw.organiflow.modules.kpi.seeders;

import com.sw.organiflow.modules.kpi.enums.KpiCategory;
import com.sw.organiflow.modules.kpi.models.KpiDefinition;
import com.sw.organiflow.modules.kpi.repositories.KpiDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class KpiDefinitionSeeder implements ApplicationRunner {

    private final KpiDefinitionRepository repository;

    @Override
    public void run(ApplicationArguments args) {
        if (repository.count() == 0) {
            List<KpiDefinition> definitions = Arrays.asList(
                // Eficiencia de Ejecución
                KpiDefinition.builder()
                    .code("EXEC_AVG_DURATION")
                    .name("Duración promedio de ejecución")
                    .description("Tiempo medio en horas desde inicio hasta completitud")
                    .category(KpiCategory.EFICIENCIA)
                    .dataSource("execution")
                    .aggregationMethod("AVG")
                    .dimensions(Arrays.asList("workflowId"))
                    .unit("hours")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("EXEC_COMPLETION_RATE")
                    .name("Tasa de completitud")
                    .description("Porcentaje de ejecuciones que llegan a estado final")
                    .category(KpiCategory.EFICIENCIA)
                    .dataSource("execution")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("workflowId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("EXEC_ACTIVE_COUNT")
                    .name("Ejecuciones activas")
                    .description("Número de workflows en ejecución actualmente")
                    .category(KpiCategory.EFICIENCIA)
                    .dataSource("execution")
                    .aggregationMethod("COUNT")
                    .filterCriteria(Map.of("status", "RUNNING"))
                    .dimensions(Arrays.asList("workflowId"))
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("EXEC_CANCELLED_RATE")
                    .name("Tasa de cancelación")
                    .description("Frecuencia de cancelaciones")
                    .category(KpiCategory.EFICIENCIA)
                    .dataSource("execution")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("workflowId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                // Productividad de Tareas
                KpiDefinition.builder()
                    .code("TASK_PENDING_COUNT")
                    .name("Tareas pendientes")
                    .description("Total de tareas en cola o en progreso")
                    .category(KpiCategory.PRODUCTIVIDAD)
                    .dataSource("task")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList("departmentId"))
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("TASK_COMPLETED_BY_USER")
                    .name("Tareas completadas por usuario")
                    .description("Productividad individual de tareas")
                    .category(KpiCategory.PRODUCTIVIDAD)
                    .dataSource("task")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList("userId"))
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("TASK_AVG_RESOLUTION_TIME")
                    .name("Tiempo promedio de resolución")
                    .description("Duración promedio desde creación hasta completitud en horas")
                    .category(KpiCategory.PRODUCTIVIDAD)
                    .dataSource("task")
                    .aggregationMethod("AVG")
                    .dimensions(Arrays.asList("departmentId"))
                    .unit("hours")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("TASK_SLA_COMPLIANCE")
                    .name("Cumplimiento de SLA")
                    .description("Porcentaje de tareas completadas a tiempo")
                    .category(KpiCategory.PRODUCTIVIDAD)
                    .dataSource("task")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("departmentId", "userId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),
                    
                KpiDefinition.builder()
                    .code("TASK_OVERDUE_RATE")
                    .name("Tasa de tareas vencidas")
                    .description("Porcentaje de tareas completadas tarde")
                    .category(KpiCategory.PRODUCTIVIDAD)
                    .dataSource("task")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("departmentId", "userId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                // Nodos
                KpiDefinition.builder()
                    .code("NODE_SKIP_RATE")
                    .name("Tasa de saltos")
                    .description("Frecuencia de nodos saltados por gateways")
                    .category(KpiCategory.NODO)
                    .dataSource("execution_node")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("nodeId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                // Departamento
                KpiDefinition.builder()
                    .code("DEPT_TASK_LOAD")
                    .name("Carga de trabajo por área")
                    .description("Tareas activas por departamento")
                    .category(KpiCategory.DEPARTAMENTO)
                    .dataSource("task")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList("departmentId"))
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),
                    
                KpiDefinition.builder()
                    .code("DEPT_AVG_COMPLETION")
                    .name("Tiempo promedio por área")
                    .description("Duración media de tareas por departamento")
                    .category(KpiCategory.DEPARTAMENTO)
                    .dataSource("task")
                    .aggregationMethod("AVG")
                    .dimensions(Arrays.asList("departmentId"))
                    .unit("hours")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                KpiDefinition.builder()
                    .code("DEPT_SLA_RATE")
                    .name("Cumplimiento SLA por área")
                    .description("Porcentaje de cumplimiento de SLA por departamento")
                    .category(KpiCategory.DEPARTAMENTO)
                    .dataSource("task")
                    .aggregationMethod("RATE")
                    .dimensions(Arrays.asList("departmentId"))
                    .unit("percent")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),

                // Tendencias
                KpiDefinition.builder()
                    .code("TREND_DAILY_THROUGHPUT")
                    .name("Throughput diario")
                    .description("Volumen de ejecuciones completadas por día")
                    .category(KpiCategory.TENDENCIA)
                    .dataSource("execution")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList())
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),
                    
                KpiDefinition.builder()
                    .code("TREND_WEEKLY_COMPLETION")
                    .name("Completitud semanal")
                    .description("Ejecuciones completadas en la semana")
                    .category(KpiCategory.TENDENCIA)
                    .dataSource("execution")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList())
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build(),
                    
                KpiDefinition.builder()
                    .code("TREND_TASK_BACKLOG")
                    .name("Backlog de tareas")
                    .description("Tareas pendientes de períodos anteriores")
                    .category(KpiCategory.TENDENCIA)
                    .dataSource("task")
                    .aggregationMethod("COUNT")
                    .dimensions(Arrays.asList())
                    .unit("count")
                    .isActive(true)
                    .createdAt(Instant.now())
                    .build()
            );

            repository.saveAll(definitions);
            log.info("Seeded {} KPI definitions", definitions.size());
        }
    }
}
