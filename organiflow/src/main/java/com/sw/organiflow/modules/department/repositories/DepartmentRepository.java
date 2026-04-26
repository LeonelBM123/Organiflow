package com.sw.organiflow.modules.department.repositories;

import com.sw.organiflow.modules.department.models.Department;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends MongoRepository<Department, String> {

    List<Department> findByTenantIdAndIsActiveTrue(String tenantId);

    Optional<Department> findByIdAndTenantId(String id, String tenantId);

    boolean existsByTenantIdAndName(String tenantId, String name);

    List<Department> findByTenantIdAndMemberUserIdsContaining(String tenantId, String userId);
}
