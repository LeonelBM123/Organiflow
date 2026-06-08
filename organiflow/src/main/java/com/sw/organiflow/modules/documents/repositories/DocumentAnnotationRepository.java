package com.sw.organiflow.modules.documents.repositories;

import com.sw.organiflow.modules.documents.models.DocumentAnnotation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentAnnotationRepository extends MongoRepository<DocumentAnnotation, String> {

    List<DocumentAnnotation> findByTenantIdAndDocumentIdOrderByCreatedAtAsc(String tenantId, String documentId);

    Optional<DocumentAnnotation> findByIdAndTenantId(String id, String tenantId);
}
