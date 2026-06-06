package com.sw.organiflow.modules.documents.repositories;

import com.sw.organiflow.modules.documents.models.DocumentAsset;
import com.sw.organiflow.modules.documents.models.DocumentScope;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentAssetRepository extends MongoRepository<DocumentAsset, String> {

    Optional<DocumentAsset> findByIdAndTenantId(String id, String tenantId);

    List<DocumentAsset> findByTenantIdAndNodeIdAndScope(String tenantId, String nodeId, DocumentScope scope);

    List<DocumentAsset> findByTenantIdAndTaskId(String tenantId, String taskId);

    /** Documentos donde el usuario figura en la lista de permisos (compartidos con él). */
    List<DocumentAsset> findByTenantIdAndPermissionsUserId(String tenantId, String userId);
}
