package com.sw.organiflow.modules.workflow.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.models.WorkflowVersion;
import com.sw.organiflow.modules.workflow.dtos.*;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import com.sw.organiflow.shared.enums.WorkflowStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

    // Crear workflow vacío — el grafo se llena después desde el canvas
    public WorkflowResponse create(WorkflowRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId   = getCurrentUserId();

        Workflow workflow = Workflow.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .status(WorkflowStatus.DRAFT)
                .currentVersion(0)
                .createdBy(userId)
                .build();

        Workflow saved = workflowRepository.save(workflow);
        log.info("Workflow creado: {} en tenant: {}", saved.getId(), tenantId);
        return WorkflowResponse.from(saved);
    }

    // Listar todos los workflows del tenant — resumen sin el grafo
    public List<WorkflowSummaryResponse> findAll() {
        String tenantId = TenantContext.getTenantId();
        return workflowRepository.findByTenantId(tenantId)
                .stream()
                .map(WorkflowSummaryResponse::from)
                .toList();
    }

    // Listar solo los publicados — para que los usuarios puedan iniciar ejecuciones
    public List<WorkflowSummaryResponse> findPublished() {
        String tenantId = TenantContext.getTenantId();
        return workflowRepository
                .findByTenantIdAndStatus(tenantId, WorkflowStatus.PUBLISHED)
                .stream()
                .map(WorkflowSummaryResponse::from)
                .toList();
    }

    // Obtener workflow completo con el grafo — para cargar el canvas
    public WorkflowResponse findById(String id) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);
        return WorkflowResponse.from(workflow);
    }

    // Actualizar nombre y descripción
    public WorkflowResponse update(String id, WorkflowRequest request) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);

        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());

        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    // Guardar el grafo completo desde Syncfusion — se llama en cada auto-save
    public WorkflowResponse saveGraph(String id, WorkflowSaveRequest request) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);

        // Solo se puede editar si está en DRAFT
        if (workflow.getStatus() == WorkflowStatus.ARCHIVED) {
            throw new RuntimeException("No se puede editar un workflow archivado");
        }

        workflow.setLanes(request.getLanes());
        workflow.setNodes(request.getNodes());
        workflow.setEdges(request.getEdges());
        workflow.setUiSchema(request.getUiSchema());
        log.info("Grafo guardado — workflow: {}, nodos: {}, edges: {}",
                id,
                request.getNodes() != null ? request.getNodes().size() : 0,
                request.getEdges() != null ? request.getEdges().size() : 0);

        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    // Publicar — valida el grafo y crea un snapshot de versión
    public WorkflowResponse publish(String id, WorkflowPublishRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId   = getCurrentUserId();
        Workflow workflow = findByIdAndTenant(id, tenantId);

        validateForPublish(workflow);

        // Incrementar versión
        int newVersion = workflow.getCurrentVersion() + 1;
        workflow.setCurrentVersion(newVersion);

        // Guardar snapshot inmutable de esta versión
        WorkflowVersion version = WorkflowVersion.builder()
                .versionNumber(newVersion)
                .lanes(workflow.getLanes())
                .nodes(workflow.getNodes())
                .edges(workflow.getEdges())
                .changelog(request.getChangelog())
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        workflow.getVersions().add(version);
        workflow.setStatus(WorkflowStatus.PUBLISHED);

        log.info("Workflow publicado: {} versión: {}", id, newVersion);
        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    // Archivar — deshabilitar sin borrar
    public WorkflowResponse archive(String id) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);
        workflow.setStatus(WorkflowStatus.ARCHIVED);
        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    // Volver a DRAFT para editar un workflow publicado
    public WorkflowResponse revertToDraft(String id) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);

        if (workflow.getStatus() == WorkflowStatus.ARCHIVED) {
            throw new RuntimeException("No se puede reactivar un workflow archivado");
        }

        workflow.setStatus(WorkflowStatus.DRAFT);
        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    public void delete(String id) {
        String tenantId = TenantContext.getTenantId();
        Workflow workflow = findByIdAndTenant(id, tenantId);

        if (workflow.getStatus() == WorkflowStatus.PUBLISHED) {
            throw new RuntimeException(
                    "No se puede eliminar un workflow publicado. Archivalo primero."
            );
        }

        workflowRepository.delete(workflow);
        log.info("Workflow eliminado: {}", id);
    }

    // ---- Helpers privados ----

    private Workflow findByIdAndTenant(String id, String tenantId) {
        return workflowRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "Workflow no encontrado o no pertenece a tu empresa"
                ));
    }

    private void validateForPublish(Workflow workflow) {
        if (workflow.getNodes() == null || workflow.getNodes().isEmpty()) {
            throw new RuntimeException("El workflow no tiene nodos");
        }

        boolean hasStart = workflow.getNodes().stream()
                .anyMatch(n -> n.getType() != null &&
                        n.getType().name().equals("START"));
        if (!hasStart) {
            throw new RuntimeException("El workflow debe tener al menos un nodo START");
        }

        boolean hasEnd = workflow.getNodes().stream()
                .anyMatch(n -> n.getType() != null &&
                        n.getType().name().equals("END"));
        if (!hasEnd) {
            throw new RuntimeException("El workflow debe tener al menos un nodo END");
        }

        if (workflow.getEdges() == null || workflow.getEdges().isEmpty()) {
            throw new RuntimeException("El workflow no tiene conexiones entre nodos");
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // El username en Spring Security es el email — lo usamos para identificar
        return auth != null ? auth.getName() : "system";
    }
}