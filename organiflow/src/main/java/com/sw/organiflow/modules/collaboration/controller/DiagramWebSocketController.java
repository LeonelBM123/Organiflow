package com.sw.organiflow.modules.collaboration.controller;

import com.sw.organiflow.modules.collaboration.dto.*;
import com.sw.organiflow.modules.collaboration.service.CollaborationService;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DiagramWebSocketController {

    private final CollaborationService collaborationService;
    private final WorkflowRepository workflowRepository;

    @MessageMapping("/diagram/{workflowId}/join")
    public void join(@DestinationVariable String workflowId, Principal principal) {
        PrincipalData data = extractPrincipalData(principal);
        if (data == null) return;

        if (!workflowRepository.existsByIdAndTenantId(workflowId, data.tenantId())) {
            log.warn("JOIN rechazado: workflowId={} no pertenece a tenantId={}", workflowId, data.tenantId());
            return;
        }

        collaborationService.getOrCreateSession(workflowId, data.tenantId(), data.userId(), data.userName());
        collaborationService.sendSyncToUser(data.userId(), workflowId, data.tenantId());

        DiagramEvent event = DiagramEvent.builder()
                .eventType(DiagramEventType.USER_JOINED)
                .workflowId(workflowId)
                .tenantId(data.tenantId())
                .userId(data.userId())
                .userName(data.userName())
                .payload(new PresencePayload(
                        collaborationService.getActiveUsers(workflowId, data.tenantId())
                ))
                .timestamp(LocalDateTime.now())
                .build();

        collaborationService.broadcastEvent(data.tenantId(), workflowId, event);
        log.info("USER_JOINED: userId={} en workflowId={}", data.userId(), workflowId);
    }

    @MessageMapping("/diagram/{workflowId}/leave")
    public void leave(@DestinationVariable String workflowId, Principal principal) {
        PrincipalData data = extractPrincipalData(principal);
        if (data == null) return;

        collaborationService.removeSession(workflowId, data.userId());

        DiagramEvent event = DiagramEvent.builder()
                .eventType(DiagramEventType.USER_LEFT)
                .workflowId(workflowId)
                .tenantId(data.tenantId())
                .userId(data.userId())
                .userName(data.userName())
                .payload(new PresencePayload(
                        collaborationService.getActiveUsers(workflowId, data.tenantId())
                ))
                .timestamp(LocalDateTime.now())
                .build();

        collaborationService.broadcastEvent(data.tenantId(), workflowId, event);
        log.info("USER_LEFT: userId={} de workflowId={}", data.userId(), workflowId);
    }

    @MessageMapping("/diagram/{workflowId}/changed")
    public void changed(@DestinationVariable String workflowId,
                        @Payload DiagramChangeRequest request,
                        Principal principal) {
        log.info("CHANGED recibido: workflowId={}, uiSchema.length={}",
                workflowId, request.uiSchema() != null ? request.uiSchema().length() : 0);

        PrincipalData data = extractPrincipalData(principal);
        if (data == null) return;

        if (!workflowRepository.existsByIdAndTenantId(workflowId, data.tenantId())) {
            log.warn("CHANGED rechazado: workflowId={} no pertenece a tenantId={}", workflowId, data.tenantId());
            return;
        }

        try {
            collaborationService.persistUiSchema(workflowId, data.tenantId(), request.uiSchema());
        } catch (Exception e) {
            log.error("Error en persistUiSchema — aun así se hace broadcast: {}", e.getMessage());
        }

        collaborationService.updateCursor(workflowId, data.userId(), null, null, null);

        DiagramEvent event = DiagramEvent.builder()
                .eventType(DiagramEventType.DIAGRAM_CHANGED)
                .workflowId(workflowId)
                .tenantId(data.tenantId())
                .userId(data.userId())
                .userName(data.userName())
                .userColor(resolveUserColor(workflowId, data.tenantId(), data.userId()))
                .payload(new DiagramChangedPayload(request.uiSchema()))
                .timestamp(LocalDateTime.now())
                .build();

        log.info("DIAGRAM_CHANGED broadcast a topic: workflow.{}.{}", data.tenantId(), workflowId);
        collaborationService.broadcastEvent(data.tenantId(), workflowId, event);
    }

    @MessageMapping("/diagram/{workflowId}/cursor")
    public void cursor(@DestinationVariable String workflowId,
                       @Payload CursorMoveRequest request,
                       Principal principal) {
        PrincipalData data = extractPrincipalData(principal);
        if (data == null) return;

        collaborationService.updateCursor(workflowId, data.userId(),
                request.x(), request.y(), request.selectedNodeId());

        DiagramEvent event = DiagramEvent.builder()
                .eventType(DiagramEventType.CURSOR_MOVED)
                .workflowId(workflowId)
                .tenantId(data.tenantId())
                .userId(data.userId())
                .userName(data.userName())
                .userColor(resolveUserColor(workflowId, data.tenantId(), data.userId()))
                .payload(new CursorPayload(request.x(), request.y(), request.selectedNodeId()))
                .timestamp(LocalDateTime.now())
                .build();

        collaborationService.broadcastEvent(data.tenantId(), workflowId, event);
    }

    @SuppressWarnings("unchecked")
    private PrincipalData extractPrincipalData(Principal principal) {
        if (!(principal instanceof UsernamePasswordAuthenticationToken auth)) {
            log.warn("Principal no es UsernamePasswordAuthenticationToken");
            return null;
        }

        if (!(auth.getDetails() instanceof Map<?, ?> details)) {
            log.warn("Details del Principal no son un Map");
            return null;
        }

        String userId = (String) details.get("userId");
        String tenantId = (String) details.get("tenantId");
        String email = (String) details.get("email");

        return new PrincipalData(userId, tenantId, email);
    }

    private String resolveUserColor(String workflowId, String tenantId, String userId) {
        return collaborationService.getActiveUsers(workflowId, tenantId)
                .stream()
                .filter(u -> u.userId().equals(userId))
                .map(u -> u.userColor())
                .findFirst()
                .orElse(null);
    }

    private record PrincipalData(String userId, String tenantId, String userName) {}
}
