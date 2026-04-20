package com.sw.organiflow.modules.workflow.repositories;

import com.sw.organiflow.modules.workflow.models.Workflow;
import com.sw.organiflow.shared.enums.WorkflowStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends MongoRepository<Workflow, String> {

    List<Workflow> findByTenantId(String tenantId);

    List<Workflow> findByTenantIdAndStatus(String tenantId, WorkflowStatus status);

    Optional<Workflow> findByIdAndTenantId(String id, String tenantId);

    boolean existsByIdAndTenantId(String id, String tenantId);
}