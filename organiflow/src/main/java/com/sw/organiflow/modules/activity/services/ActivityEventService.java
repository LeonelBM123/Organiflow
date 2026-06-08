package com.sw.organiflow.modules.activity.services;

import com.sw.organiflow.modules.activity.dtos.ActivityEventResponse;
import com.sw.organiflow.modules.activity.models.ActivityEvent;
import com.sw.organiflow.modules.activity.models.ActivityEventType;
import com.sw.organiflow.modules.activity.repositories.ActivityEventRepository;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityEventService {

    private final ActivityEventRepository repository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String TOPIC_PREFIX = "/topic/activity.";

    /**
     * Persiste un evento de actividad y lo difunde por WebSocket a todos los suscriptores
     * del topic de la ejecución (si executionId no es nulo).
     */
    public ActivityEventResponse record(
            String tenantId,
            String executionId,
            String documentId,
            String actorUserId,
            ActivityEventType eventType,
            String entityType,
            String entityId,
            Map<String, Object> metadata) {

        String actorName = resolveActorName(actorUserId);

        ActivityEvent event = ActivityEvent.builder()
                .tenantId(tenantId)
                .executionId(executionId)
                .documentId(documentId)
                .actorUserId(actorUserId)
                .actorName(actorName)
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .metadata(metadata != null ? metadata : Map.of())
                .occurredAt(Instant.now())
                .build();

        ActivityEvent saved = repository.save(event);
        ActivityEventResponse response = ActivityEventResponse.from(saved);

        if (executionId != null && tenantId != null) {
            try {
                messagingTemplate.convertAndSend(TOPIC_PREFIX + tenantId + "." + executionId, response);
            } catch (Exception e) {
                log.warn("No se pudo difundir evento de actividad por WebSocket: {}", e.getMessage());
            }
        }

        return response;
    }

    public List<ActivityEventResponse> getByExecution(String tenantId, String executionId) {
        return repository
                .findByTenantIdAndExecutionIdOrderByOccurredAtAsc(tenantId, executionId)
                .stream()
                .map(ActivityEventResponse::from)
                .toList();
    }

    public List<ActivityEventResponse> getByDocument(String tenantId, String documentId) {
        return repository
                .findByTenantIdAndDocumentIdOrderByOccurredAtAsc(tenantId, documentId)
                .stream()
                .map(ActivityEventResponse::from)
                .toList();
    }

    private String resolveActorName(String userId) {
        if (userId == null) return "Sistema";
        return userRepository.findById(userId)
                .map(u -> {
                    if (u.getName() != null && !u.getName().isBlank()) return u.getName();
                    return u.getEmail() != null ? u.getEmail() : "Usuario";
                })
                .orElse("Usuario");
    }
}
