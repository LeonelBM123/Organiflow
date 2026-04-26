package com.sw.organiflow.modules.execution.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.execution.dtos.ExecutionRequest;
import com.sw.organiflow.modules.execution.dtos.ExecutionResponse;
import com.sw.organiflow.modules.execution.dtos.ExecutionSummaryResponse;
import com.sw.organiflow.modules.execution.models.Execution;
import com.sw.organiflow.modules.execution.models.ExecutionNode;
import com.sw.organiflow.modules.execution.repositories.ExecutionRepository;
import com.sw.organiflow.modules.task.services.TaskService;
import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.models.WorkflowEdge;
import com.sw.organiflow.modules.workflow.models.WorkflowNode;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import com.sw.organiflow.shared.enums.NodeType;
import com.sw.organiflow.shared.enums.TaskStatus;
import com.sw.organiflow.shared.enums.WorkflowStatus;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final WorkflowRepository workflowRepository;
    private final TaskService taskService;

    @Autowired
    public ExecutionService(ExecutionRepository executionRepository,
                            WorkflowRepository workflowRepository,
                            TaskService taskService) {
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.taskService = taskService;
    }

    public ExecutionResponse start(ExecutionRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();

        Workflow workflow = workflowRepository
                .findByIdAndTenantId(request.getWorkflowId(), tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "Workflow no encontrado o no pertenece a tu empresa"));

        if (workflow.getStatus() != WorkflowStatus.PUBLISHED) {
            throw new RuntimeException(
                    "Solo se pueden iniciar ejecuciones de workflows publicados");
        }

        WorkflowNode startNode = findStartNode(workflow);

        List<ExecutionNode> executionNodes = new ArrayList<>();
        List<String> currentNodeIds = new ArrayList<>();

        ExecutionNode startExNode = ExecutionNode.builder()
                .nodeId(startNode.getId())
                .nodeName(startNode.getName())
                .nodeType(startNode.getType())
                .status(TaskStatus.DONE)
                .startedAt(Instant.now())
                .completedAt(Instant.now())
                .build();
        executionNodes.add(startExNode);

        List<WorkflowNode> nextNodes = findNextNodes(workflow, startNode.getId(), new java.util.HashMap<>());
        for (WorkflowNode next : nextNodes) {
            ExecutionNode pending = ExecutionNode.builder()
                    .nodeId(next.getId())
                    .nodeName(next.getName())
                    .nodeType(next.getType())
                    .status(TaskStatus.PENDING)
                    .assignedUserId(next.getAssignedUserId())
                    .startedAt(Instant.now())
                    .build();
            executionNodes.add(pending);
            currentNodeIds.add(next.getId());
        }

        Execution execution = Execution.builder()
                .tenantId(tenantId)
                .workflowId(workflow.getId())
                .workflowName(workflow.getName())
                .workflowVersion(workflow.getCurrentVersion())
                .initiatedByUserId(userId)
                .status(ExecutionStatus.RUNNING)
                .currentNodeIds(currentNodeIds)
                .executionNodes(executionNodes)
                .startedAt(Instant.now())
                .build();

        Execution saved = executionRepository.save(execution);
        log.info("Ejecución iniciada: {} workflow: {} tenant: {}", saved.getId(), workflow.getId(), tenantId);

        for (WorkflowNode next : nextNodes) {
            taskService.createFromNode(tenantId, saved.getId(), workflow.getId(), next);
        }

        return ExecutionResponse.from(saved);
    }

    public List<ExecutionSummaryResponse> findAll() {
        String tenantId = TenantContext.getTenantId();
        return executionRepository.findByTenantId(tenantId)
                .stream()
                .map(ExecutionSummaryResponse::from)
                .toList();
    }

    public List<ExecutionSummaryResponse> findMine() {
        String tenantId = TenantContext.getTenantId();
        String userId = SecurityUtils.getCurrentUserId();
        return executionRepository.findByTenantIdAndInitiatedByUserId(tenantId, userId)
                .stream()
                .map(ExecutionSummaryResponse::from)
                .toList();
    }

    public ExecutionResponse findById(String id) {
        return ExecutionResponse.from(findByIdAndTenant(id));
    }

    public ExecutionResponse cancel(String id) {
        Execution execution = findByIdAndTenant(id);

        if (execution.getStatus() != ExecutionStatus.RUNNING
                && execution.getStatus() != ExecutionStatus.PAUSED) {
            throw new RuntimeException(
                    "Solo se puede cancelar una ejecución en estado RUNNING o PAUSED");
        }

        execution.setStatus(ExecutionStatus.CANCELED);
        execution.setCompletedAt(Instant.now());

        Execution saved = executionRepository.save(execution);
        log.info("Ejecución cancelada: {}", id);
        return ExecutionResponse.from(saved);
    }

    public ExecutionResponse advance(String executionId, String nodeId, Map<String, Object> formData) {
        Execution execution = findByIdAndTenant(executionId);

        if (execution.getStatus() != ExecutionStatus.RUNNING) {
            throw new RuntimeException("La ejecución no está en estado RUNNING");
        }

        if (!execution.getCurrentNodeIds().contains(nodeId)) {
            throw new RuntimeException("El nodo no está activo en esta ejecución");
        }

        Workflow workflow = workflowRepository
                .findByIdAndTenantId(execution.getWorkflowId(), execution.getTenantId())
                .orElseThrow(() -> new RuntimeException("Workflow no encontrado"));

        ExecutionNode execNode = execution.getExecutionNodes().stream()
                .filter(n -> n.getNodeId().equals(nodeId)
                        && n.getStatus() != TaskStatus.DONE
                        && n.getStatus() != TaskStatus.SKIPPED)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Nodo no encontrado en la ejecución"));

        execNode.setStatus(TaskStatus.DONE);
        execNode.setFormData(formData);
        execNode.setCompletedAt(Instant.now());
        execution.getCurrentNodeIds().remove(nodeId);

        if (formData != null && !formData.isEmpty()) {
            execution.getGlobalVariables().putAll(formData);
        }

        WorkflowNode workflowNode = findWorkflowNode(workflow, nodeId);
        List<WorkflowNode> newTaskNodes = new ArrayList<>();

        if (workflowNode.getType() == NodeType.END) {
            if (execution.getCurrentNodeIds().isEmpty()) {
                execution.setStatus(ExecutionStatus.COMPLETED);
                execution.setCompletedAt(Instant.now());
            }
        } else {
            List<WorkflowNode> initialNextNodes = findNextNodes(workflow, nodeId, execution.getGlobalVariables());
            java.util.Queue<WorkflowNode> nodeQueue = new java.util.LinkedList<>(initialNextNodes);
            
            while (!nodeQueue.isEmpty()) {
                WorkflowNode next = nodeQueue.poll();
                
                if (next.getType() == NodeType.MERGE) {
                    if (!isMergeReady(workflow, execution, next.getId())) {
                        continue; // Wait until all incoming edges are done
                    }
                }

                boolean hasActiveExisting = execution.getExecutionNodes().stream()
                        .anyMatch(n -> n.getNodeId().equals(next.getId()) &&
                                (n.getStatus() == TaskStatus.PENDING || n.getStatus() == TaskStatus.IN_PROGRESS));

                if (!hasActiveExisting) {
                    ExecutionNode newNode = ExecutionNode.builder()
                            .nodeId(next.getId())
                            .nodeName(next.getName())
                            .nodeType(next.getType())
                            .status(TaskStatus.PENDING)
                            .assignedUserId(next.getAssignedUserId())
                            .startedAt(Instant.now())
                            .build();
                    execution.getExecutionNodes().add(newNode);
                    execution.getCurrentNodeIds().add(next.getId());

                    if (next.getType() == NodeType.END) {
                        newNode.setStatus(TaskStatus.DONE);
                        newNode.setCompletedAt(Instant.now());
                        execution.getCurrentNodeIds().remove(next.getId());
                        if (execution.getCurrentNodeIds().isEmpty()) {
                            execution.setStatus(ExecutionStatus.COMPLETED);
                            execution.setCompletedAt(Instant.now());
                        }
                    } else if (next.getType() == NodeType.MERGE) {
                        newNode.setStatus(TaskStatus.DONE);
                        newNode.setCompletedAt(Instant.now());
                        execution.getCurrentNodeIds().remove(next.getId());

                        List<WorkflowNode> postMergeNodes = findNextNodes(workflow, next.getId(), execution.getGlobalVariables());
                        nodeQueue.addAll(postMergeNodes);
                    } else if (next.getType() == NodeType.CONDITION) {
                        // CONDITION es un gateway automático: se evalúa con globalVariables
                        // sin intervención humana, igual que MERGE.
                        newNode.setStatus(TaskStatus.DONE);
                        newNode.setCompletedAt(Instant.now());
                        execution.getCurrentNodeIds().remove(next.getId());

                        // findNextNodes llama a evaluateCondition internamente:
                        // solo retorna los nodos cuyos edges pasan la regla configurada.
                        List<WorkflowNode> postConditionNodes = findNextNodes(workflow, next.getId(), execution.getGlobalVariables());
                        nodeQueue.addAll(postConditionNodes);
                    } else {
                        newTaskNodes.add(next);
                    }
                }
            }
        }

        Execution saved = executionRepository.save(execution);
        log.info("Nodo {} avanzado en ejecución {}", nodeId, executionId);

        for (WorkflowNode next : newTaskNodes) {
            taskService.createFromNode(saved.getTenantId(), saved.getId(), saved.getWorkflowId(), next);
        }

        return ExecutionResponse.from(saved);
    }

    private boolean isMergeReady(Workflow workflow, Execution execution, String mergeNodeId) {
        // Obtenemos los sub-procesos anteriores que apuntan al Merge
        List<String> incomingNodeIds = workflow.getEdges().stream()
                .filter(e -> e.getTargetId().equals(mergeNodeId))
                .map(WorkflowEdge::getSourceId)
                .toList();

        // Para AND-join simple: verificamos que todos los sourceIds tengan al menos una tarea en estado DONE.
        // Ojo: Si la lógica de negocio descarta caminos exclusivos, esto podría esperar infinitamente. 
        // Asumiendo un entorno donde los merges tienen incoming edges de caminos seguros o completados.
        for (String inNode : incomingNodeIds) {
            boolean isDone = execution.getExecutionNodes().stream()
                    .anyMatch(n -> n.getNodeId().equals(inNode) && n.getStatus() == TaskStatus.DONE);
            if (!isDone) return false;
        }
        return true;
    }

    private WorkflowNode findStartNode(Workflow workflow) {
        return workflow.getNodes().stream()
                .filter(n -> n.getType() == NodeType.START)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("El workflow no tiene nodo START"));
    }

    private List<WorkflowNode> findNextNodes(Workflow workflow, String sourceNodeId, Map<String, Object> globalVariables) {
        WorkflowNode sourceNode = findWorkflowNode(workflow, sourceNodeId);

        List<String> nextIds = workflow.getEdges().stream()
                .filter(e -> e.getSourceId().equals(sourceNodeId))
                .filter(e -> evaluateCondition(e.getConditionRule(), globalVariables, sourceNode.getType()))
                .map(WorkflowEdge::getTargetId)
                .toList();

        return workflow.getNodes().stream()
                .filter(n -> nextIds.contains(n.getId()))
                .toList();
    }

    private boolean evaluateCondition(com.sw.organiflow.modules.workflow.models.ConditionRule rule, Map<String, Object> globalVariables, NodeType sourceType) {
        if (sourceType != NodeType.CONDITION) {
            return true;
        }
        if (rule == null || rule.getField() == null || rule.getField().isEmpty()) {
            return true; // Sin regla configurada = pasa siempre
        }

        Object varValue = globalVariables.get(rule.getField());
        if (varValue == null) return false;

        String op = rule.getOperator();
        String ruleValue = String.valueOf(rule.getValue());
        String valText   = String.valueOf(varValue);

        // Comparación de cadenas / booleanos
        if ("==".equals(op)) return valText.equals(ruleValue);
        if ("!=".equals(op)) return !valText.equals(ruleValue);

        // Comparación numérica — intentar parsear ambos lados
        try {
            double left  = Double.parseDouble(valText);
            double right = Double.parseDouble(ruleValue);
            if (">".equals(op))  return left >  right;
            if (">=".equals(op)) return left >= right;
            if ("<".equals(op))  return left <  right;
            if ("<=".equals(op)) return left <= right;
        } catch (NumberFormatException e) {
            log.warn("[evaluateCondition] No se pudo comparar numéricamente '{}' {} '{}' — evaluando como false",
                    valText, op, ruleValue);
            return false;
        }

        log.warn("[evaluateCondition] Operador desconocido '{}' — evaluando como false", op);
        return false;
    }

    private WorkflowNode findWorkflowNode(Workflow workflow, String nodeId) {
        return workflow.getNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Nodo no encontrado en el workflow"));
    }

    private Execution findByIdAndTenant(String id) {
        String tenantId = TenantContext.getTenantId();
        return executionRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Ejecución no encontrada o no pertenece a tu empresa"));
    }

}
