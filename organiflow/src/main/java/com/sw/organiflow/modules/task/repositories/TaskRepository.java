package com.sw.organiflow.modules.task.repositories;

import com.sw.organiflow.modules.task.models.Task;
import com.sw.organiflow.shared.enums.TaskStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByTenantIdAndAssignedUserId(String tenantId, String userId);

    List<Task> findByTenantIdAndDepartmentIdIn(String tenantId, List<String> departmentIds);

    List<Task> findByTenantIdAndExecutionId(String tenantId, String executionId);

    Optional<Task> findByIdAndTenantId(String id, String tenantId);

    List<Task> findByStatusAndDueAtLessThan(TaskStatus status, Instant dueAt);

    List<Task> findByStatusAndDueAtBetween(TaskStatus status, Instant from, Instant to);
}
