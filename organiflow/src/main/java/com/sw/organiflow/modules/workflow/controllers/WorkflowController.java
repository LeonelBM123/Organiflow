package com.sw.organiflow.modules.workflow.controllers;

import com.sw.organiflow.modules.workflow.dtos.*;
import com.sw.organiflow.modules.workflow.services.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
public class WorkflowController {
    private final WorkflowService workflowService;

    // Crear workflow vacío
    @PostMapping
    public ResponseEntity<WorkflowResponse> create(
            @Valid @RequestBody WorkflowRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.create(request));
    }

    // Listar todos (resumen)
    @GetMapping
    public ResponseEntity<List<WorkflowSummaryResponse>> findAll() {
        return ResponseEntity.ok(workflowService.findAll());
    }

    // Listar solo publicados — para usuarios que inician ejecuciones
    @GetMapping("/published")
    public ResponseEntity<List<WorkflowSummaryResponse>> findPublished() {
        return ResponseEntity.ok(workflowService.findPublished());
    }

    // Obtener con grafo completo — para cargar en Syncfusion
    @GetMapping("/{id}")
    public ResponseEntity<WorkflowResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.findById(id));
    }

    // Actualizar nombre/descripción
    @PutMapping("/{id}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable String id,
            @Valid @RequestBody WorkflowRequest request
    ) {
        return ResponseEntity.ok(workflowService.update(id, request));
    }

    // Guardar el grafo completo desde Syncfusion (auto-save)
    @PutMapping("/{id}/graph")
    public ResponseEntity<WorkflowResponse> saveGraph(
            @PathVariable String id,
            @RequestBody WorkflowSaveRequest request
    ) {
        return ResponseEntity.ok(workflowService.saveGraph(id, request));
    }

    // Publicar workflow
    @PostMapping("/{id}/publish")
    public ResponseEntity<WorkflowResponse> publish(
            @PathVariable String id,
            @RequestBody WorkflowPublishRequest request
    ) {
        return ResponseEntity.ok(workflowService.publish(id, request));
    }

    // Volver a borrador
    @PostMapping("/{id}/draft")
    public ResponseEntity<WorkflowResponse> revertToDraft(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.revertToDraft(id));
    }

    // Archivar
    @PostMapping("/{id}/archive")
    public ResponseEntity<WorkflowResponse> archive(@PathVariable String id) {
        return ResponseEntity.ok(workflowService.archive(id));
    }

    // Eliminar (solo DRAFT)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        workflowService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
