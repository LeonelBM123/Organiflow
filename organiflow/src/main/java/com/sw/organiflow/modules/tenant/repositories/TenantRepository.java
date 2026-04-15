package com.sw.organiflow.modules.tenant.repositories;

import com.sw.organiflow.modules.tenant.models.Tenant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TenantRepository extends MongoRepository<Tenant, String> {
    boolean existsBySlug(String slug);
}