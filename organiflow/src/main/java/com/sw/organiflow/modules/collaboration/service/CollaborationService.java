package com.sw.organiflow.modules.collaboration.service;

import com.sw.organiflow.modules.collaboration.document.DiagramSession;
import com.sw.organiflow.modules.collaboration.dto.*;
import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.modules.workflow.repositories.WorkflowRepository;
import com.sw.organiflow.modules.collaboration.repository.DiagramSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollaborationService {

    private static final List<String> USER_COLORS = List.of(
            "#1d9e75", "#378add", "#d85a30", "#7f77dd",
            "#d4537e", "#639922", "#ba7517", "#e24b4a"
    );

    private final DiagramSessionRepository sessionRepository;
    private final WorkflowRepository workflowRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public DiagramSession getOrCreateSession(String workflowId, String tenantId,
                                              String userId, String userName) {
        return sessionRepository.findByWorkflowIdAndUserId(workflowId, userId)
                .map(existing -> {
                    existing.setLastSeen(new Date());
                    return sessionRepository.save(existing);
                })
                .orElseGet(() -> {
                    String color = assignColor(workflowId, tenantId);
                    DiagramSession session = DiagramSession.builder()
                            .workflowId(workflowId)
                            .tenantId(tenantId)
                            .userId(userId)
                            .userName(userName)
                            .userColor(color)
                            .lastSeen(new Date())
                            .build();
                    return sessionRepository.save(session);
                });
    }

    public List<ActiveUserDto> getActiveUsers(String workflowId, String tenantId) {
        return sessionRepository.findByWorkflowIdAndTenantId(workflowId, tenantId)
                .stream()
                .map(s -> new ActiveUserDto(s.getUserId(), s.getUserName(), s.getUserColor()))
                .toList();
    }

    public void updateCursor(String workflowId, String userId,
                              Double x, Double y, String selectedNodeId) {
        sessionRepository.findByWorkflowIdAndUserId(workflowId, userId)
                .ifPresent(session -> {
                    session.setCursorX(x);
                    session.setCursorY(y);
                    session.setSelectedNodeId(selectedNodeId);
                    session.setLastSeen(new Date());
                    sessionRepository.save(session);
                });
    }

    public void persistUiSchema(String workflowId, String tenantId, String uiSchema) {
        Workflow workflow = workflowRepository.findByIdAndTenantId(workflowId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Workflow no encontrado: workflowId=%s, tenantId=%s".formatted(workflowId, tenantId)));
        workflow.setUiSchema(uiSchema);
        workflowRepository.save(workflow);
        log.debug("uiSchema persistido para workflowId={}", workflowId);
    }

    public void removeSession(String workflowId, String userId) {
        sessionRepository.deleteByWorkflowIdAndUserId(workflowId, userId);
        log.debug("Sesión eliminada: workflowId={}, userId={}", workflowId, userId);
    }

    public String assignColor(String workflowId, String tenantId) {
        List<String> usedColors = sessionRepository.findByWorkflowIdAndTenantId(workflowId, tenantId)
                .stream()
                .map(DiagramSession::getUserColor)
                .toList();

        return USER_COLORS.stream()
                .filter(color -> !usedColors.contains(color))
                .findFirst()
                .orElse(USER_COLORS.get(0));
    }

    public void broadcastEvent(String tenantId, String workflowId, DiagramEvent event) {
        String destination = "/topic/workflow.%s.%s".formatted(tenantId, workflowId);
        messagingTemplate.convertAndSend(destination, event);
    }

    public void sendSyncToUser(String userId, String workflowId, String tenantId) {
        Workflow workflow = workflowRepository.findByIdAndTenantId(workflowId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Workflow no encontrado al sincronizar: workflowId=%s".formatted(workflowId)));

        DiagramEvent syncEvent = DiagramEvent.builder()
                .eventType(DiagramEventType.DIAGRAM_SYNCED)
                .workflowId(workflowId)
                .tenantId(tenantId)
                .payload(new DiagramChangedPayload(workflow.getUiSchema()))
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSendToUser(userId, "/queue/sync", syncEvent);
        log.debug("DIAGRAM_SYNCED enviado a userId={} para workflowId={}", userId, workflowId);
    }
}
