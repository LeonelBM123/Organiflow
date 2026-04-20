package com.sw.organiflow.modules.collaboration.controller;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.collaboration.dto.ActiveUserDto;
import com.sw.organiflow.modules.collaboration.dto.DiagramSyncResponse;
import com.sw.organiflow.modules.collaboration.service.CollaborationService;
import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/v1/collaboration")
@RequiredArgsConstructor
@Slf4j
public class CollaborationController {

    private final CollaborationService collaborationService;
    private final WorkflowRepository workflowRepository;

    @GetMapping("/workflows/{workflowId}/sessions")
    public ResponseEntity<List<ActiveUserDto>> getActiveSessions(@PathVariable String workflowId) {
        String tenantId = TenantContext.getTenantId();

        if (!workflowRepository.existsByIdAndTenantId(workflowId, tenantId)) {
            throw new ResponseStatusException(FORBIDDEN,
                    "El workflow no pertenece al tenant actual");
        }

        List<ActiveUserDto> activeUsers = collaborationService.getActiveUsers(workflowId, tenantId);
        return ResponseEntity.ok(activeUsers);
    }

    @GetMapping("/workflows/{workflowId}/sync")
    public ResponseEntity<DiagramSyncResponse> sync(@PathVariable String workflowId) {
        String tenantId = TenantContext.getTenantId();

        Workflow workflow = workflowRepository.findByIdAndTenantId(workflowId, tenantId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND,
                        "Workflow no encontrado: " + workflowId));

        DiagramSyncResponse response = new DiagramSyncResponse(
                workflow.getId(),
                workflow.getUiSchema(),
                workflow.getCreatedBy(),
                workflow.getUpdatedAt()
        );

        return ResponseEntity.ok(response);
    }
}
