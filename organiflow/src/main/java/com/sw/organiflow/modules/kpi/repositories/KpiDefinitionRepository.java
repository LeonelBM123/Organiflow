package com.sw.organiflow.modules.kpi.repositories;

import com.sw.organiflow.modules.kpi.models.KpiDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KpiDefinitionRepository extends MongoRepository<KpiDefinition, String> {
    Optional<KpiDefinition> findByCode(String code);
}
