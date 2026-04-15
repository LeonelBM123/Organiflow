package com.sw.organiflow.modules.user.repositories;


import com.sw.organiflow.modules.user.models.UserTenantRole;
import com.sw.organiflow.shared.enums.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTenantRoleRepository extends MongoRepository<UserTenantRole, String>{
    // Rol de un usuario en un tenant específico
    Optional<UserTenantRole> findByUserIdAndTenantIdAndIsActiveTrue(
            String userId, String tenantId
    );

    // Todos los tenants de un usuario (para la vista multitenant)
    List<UserTenantRole> findByUserIdAndIsActiveTrue(String userId);

    // Todos los usuarios de un tenant con un rol específico
    List<UserTenantRole> findByTenantIdAndRoleAndIsActiveTrue(
            String tenantId, UserRole role
    );

    boolean existsByUserIdAndTenantId(String userId, String tenantId);
}
