package com.sw.organiflow.modules.auth.repositories;

import com.sw.organiflow.modules.auth.models.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String>{
    Optional<RefreshToken> findByTokenAndIsRevokedFalse(String token);

    // Para revocar todos los tokens de un usuario en un tenant
    // útil en logout, cambio de contraseña
    void deleteByUserIdAndTenantId(String userId, String tenantId);

    // Para revocar TODOS los tokens de un usuario en todos los tenants
    void deleteByUserId(String userId);
}
