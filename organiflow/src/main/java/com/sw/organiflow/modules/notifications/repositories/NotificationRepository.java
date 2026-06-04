package com.sw.organiflow.modules.notifications.repositories;

import com.sw.organiflow.modules.notifications.enums.NotificationType;
import com.sw.organiflow.modules.notifications.models.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findTop50ByTenantIdAndUserIdOrderByCreatedAtDesc(String tenantId, String userId);

    List<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(String tenantId, String userId);

    List<Notification> findTop20ByTenantIdAndUserIdAndReadFalseOrderByCreatedAtDesc(String tenantId, String userId);

    long countByTenantIdAndUserIdAndReadFalse(String tenantId, String userId);

    Optional<Notification> findByIdAndTenantIdAndUserId(String id, String tenantId, String userId);

    long deleteByCreatedAtBefore(Instant cutoff);

    boolean existsByTenantIdAndUserIdAndTypeAndEntityTypeAndEntityIdAndReadFalse(
        String tenantId, String userId, NotificationType type, String entityType, String entityId
    );
}
