package com.sw.organiflow.modules.auth.services;

import com.sw.organiflow.modules.auth.dtos.AuthResponse;
import com.sw.organiflow.modules.auth.dtos.LoginRequest;
import com.sw.organiflow.modules.auth.dtos.LoginResponse;
import com.sw.organiflow.modules.auth.dtos.TenantSelectionRequest;
import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.tenant.repositories.TenantRepository;
import com.sw.organiflow.modules.auth.models.RefreshToken;
import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.models.UserTenantRole;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.modules.user.repositories.UserTenantRoleRepository;
import com.sw.organiflow.security.jwt.JwtService;
import com.sw.organiflow.security.util.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CookieUtils cookieUtils;

    /**
     * Login paso 1: Valida credenciales y retorna lista de tenants disponibles.
     * Si el usuario solo tiene 1 tenant, genera tokens directamente.
     */
    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        java.util.List<UserTenantRole> userTenants = userTenantRoleRepository
                .findByUserIdAndIsActiveTrue(user.getId());

        if (userTenants.isEmpty()) {
            throw new RuntimeException("El usuario no tiene acceso a ninguna organización");
        }

        // Si solo tiene 1 tenant, genera los tokens directamente
        if (userTenants.size() == 1) {
            UserTenantRole tenantRole = userTenants.get(0);
            return generateTokensForTenant(user, tenantRole, response);
        }

        // Si tiene múltiples tenants, retorna la lista
        java.util.List<LoginResponse.TenantInfo> tenantInfos = userTenants.stream()
                .map(utr -> {
                    Tenant tenant = tenantRepository.findById(utr.getTenantId())
                            .orElseThrow(() -> new RuntimeException("Tenant no encontrado"));

                    return LoginResponse.TenantInfo.builder()
                            .tenantId(tenant.getId())
                            .tenantName(tenant.getName())
                            .role(utr.getRole().name())
                            .build();
                })
                .toList();

        log.info("Login exitoso: {} - {} tenants disponibles", user.getEmail(), tenantInfos.size());

        return LoginResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .tenants(tenantInfos)
                .build();
    }

    /**
     * Login paso 2: Selecciona un tenant específico y genera tokens.
     */
    public AuthResponse selectTenant(TenantSelectionRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        UserTenantRole tenantRole = userTenantRoleRepository
                .findByUserIdAndTenantIdAndIsActiveTrue(user.getId(), request.getTenantId())
                .orElseThrow(() -> new RuntimeException("No tenés acceso a esta organización"));

        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                tenantRole.getTenantId(),
                tenantRole.getRole().name()
        );

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                user.getId(),
                user.getEmail(),
                tenantRole.getTenantId(),
                tenantRole.getRole().name()
        );

        // Cookies para web
        cookieUtils.addAccessTokenCookie(response, accessToken, jwtService.getExpirationMs());
        cookieUtils.addRefreshTokenCookie(response, refreshToken.getToken(), jwtService.getRefreshExpirationMs());

        log.info("Tenant seleccionado: {} para {}", request.getTenantId(), request.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .name(user.getName())
                .role(tenantRole.getRole().name())
                .tenantId(tenantRole.getTenantId())
                .build();
    }

    /**
     * Genera tokens para un tenant específico (usado cuando solo hay 1 tenant).
     */
    private LoginResponse generateTokensForTenant(User user, UserTenantRole tenantRole, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                tenantRole.getTenantId(),
                tenantRole.getRole().name()
        );

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                user.getId(),
                user.getEmail(),
                tenantRole.getTenantId(),
                tenantRole.getRole().name()
        );

        cookieUtils.addAccessTokenCookie(response, accessToken, jwtService.getExpirationMs());
        cookieUtils.addRefreshTokenCookie(response, refreshToken.getToken(), jwtService.getRefreshExpirationMs());

        log.info("Login exitoso: {} en tenant {}", user.getEmail(), tenantRole.getTenantId());

        return LoginResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .role(tenantRole.getRole().name())
                .tenantId(tenantRole.getTenantId())
                .build();
    }

    /**
     * Refresh unificado.
     * - Web:    lee refresh token desde cookie "refresh_token".
     * - Mobile: lee refresh token desde header "X-Refresh-Token".
     */
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = extractRefreshToken(request);

        if (refreshTokenStr == null) {
            throw new RuntimeException("Refresh token no encontrado");
        }

        RefreshToken refreshToken = refreshTokenService.validateRefreshToken(refreshTokenStr);

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                refreshToken.getTenantId(),
                refreshToken.getRole()
        );

        // Rota el refresh token — el viejo se revoca, se crea uno nuevo
        refreshTokenService.revokeByUserAndTenant(
                refreshToken.getUserId(),
                refreshToken.getTenantId()
        );

        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(
                user.getId(),
                user.getEmail(),
                refreshToken.getTenantId(),
                refreshToken.getRole()
        );

        // Actualiza cookies para web
        cookieUtils.addAccessTokenCookie(response, newAccessToken, jwtService.getExpirationMs());
        cookieUtils.addRefreshTokenCookie(response, newRefreshToken.getToken(), jwtService.getRefreshExpirationMs());

        log.info("Refresh exitoso: {}", user.getEmail());

        // Body con nuevos tokens para mobile
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .email(user.getEmail())
                .name(user.getName())
                .role(refreshToken.getRole())
                .tenantId(refreshToken.getTenantId())
                .build();
    }

    /**
     * Logout — revoca todos los refresh tokens del usuario en BD y borra cookies.
     * Recibe email desde el SecurityContext (ya validado por JwtAuthFilter).
     */
    public void logout(HttpServletRequest request, HttpServletResponse response, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Revoca todos los refresh tokens del usuario (logout global en todos los dispositivos)
        refreshTokenService.revokeAllByUser(user.getId());

        // Borra cookies del navegador
        cookieUtils.clearAuthCookies(response);

        log.info("Logout: {}", email);
    }

    /**
     * Extrae el refresh token:
     * 1. Cookie "refresh_token" — web/navegadores
     * 2. Header "X-Refresh-Token" — mobile/APIs
     */
    private String extractRefreshToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            String fromCookie = Arrays.stream(request.getCookies())
                    .filter(c -> CookieUtils.REFRESH_TOKEN_COOKIE.equals(c.getName()))
                    .map(jakarta.servlet.http.Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (fromCookie != null && !fromCookie.isBlank()) {
                return fromCookie;
            }
        }

        String header = request.getHeader("X-Refresh-Token");
        return (header != null && !header.isBlank()) ? header : null;
    }
}