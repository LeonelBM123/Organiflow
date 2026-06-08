package com.sw.organiflow.modules.activity.repositories;

import com.sw.organiflow.modules.activity.models.ActivityEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ActivityEventRepository extends MongoRepository<ActivityEvent, String> {

    List<ActivityEvent> findByTenantIdAndExecutionIdOrderByOccurredAtAsc(String tenantId, String executionId);

    List<ActivityEvent> findByTenantIdAndDocumentIdOrderByOccurredAtAsc(String tenantId, String documentId);
}
