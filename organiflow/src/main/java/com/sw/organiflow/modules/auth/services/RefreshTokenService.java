package com.sw.organiflow.modules.auth.services;

import com.sw.organiflow.modules.auth.models.RefreshToken;
import com.sw.organiflow.modules.auth.repositories.RefreshTokenRepository;
import com.sw.organiflow.security.jwt.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    public RefreshToken createRefreshToken(
            String userId,
            String email,
            String tenantId,
            String role
    ) {
        // Revocamos tokens anteriores del mismo usuario+tenant
        // para que solo exista un refresh token activo a la vez
        refreshTokenRepository.deleteByUserIdAndTenantId(userId, tenantId);

        String rawToken = jwtService.generateRefreshToken(email);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawToken)
                .userId(userId)
                .tenantId(tenantId)
                .role(role)
                .isRevoked(false)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtService.getRefreshExpirationMs() / 1000
                ))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenAndIsRevokedFalse(token)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido o revocado"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Expiró — lo borramos y pedimos login de nuevo
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expirado, iniciá sesión nuevamente");
        }

        return refreshToken;
    }

    public void revokeByUserAndTenant(String userId, String tenantId) {
        refreshTokenRepository.deleteByUserIdAndTenantId(userId, tenantId);
    }

    public void revokeAllByUser(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}