package com.sw.organiflow.modules.execution.repositories;

import com.sw.organiflow.modules.execution.models.Execution;
import com.sw.organiflow.shared.enums.ExecutionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExecutionRepository extends MongoRepository<Execution, String> {

    List<Execution> findByTenantId(String tenantId);

    List<Execution> findByTenantIdAndStatus(String tenantId, ExecutionStatus status);

    List<Execution> findByTenantIdAndInitiatedByUserId(String tenantId, String userId);

    Optional<Execution> findByIdAndTenantId(String id, String tenantId);
}
