package com.sw.organiflow.modules.collaboration.repository;

import com.sw.organiflow.modules.collaboration.document.DiagramSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface DiagramSessionRepository extends MongoRepository<DiagramSession, String> {

    List<DiagramSession> findByWorkflowIdAndTenantId(String workflowId, String tenantId);

    Optional<DiagramSession> findByWorkflowIdAndUserId(String workflowId, String userId);

    void deleteByWorkflowIdAndUserId(String workflowId, String userId);
}
