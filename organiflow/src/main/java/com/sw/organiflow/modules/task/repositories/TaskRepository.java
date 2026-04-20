package com.sw.organiflow.modules.task.repositories;

import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.shared.enums.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByTenantIdAndAssignedUserId(String tenantId, String userId);

    List<Task> findByTenantIdAndAssignedRoleAndStatus(String tenantId, String role, TaskStatus status);

    List<Task> findByTenantIdAndExecutionId(String tenantId, String executionId);

    Optional<Task> findByIdAndTenantId(String id, String tenantId);
}
