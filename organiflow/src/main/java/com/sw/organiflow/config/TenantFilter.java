package com.sw.organiflow.config;

import io.jsonwebtoken.JwtException;
import com.sw.organiflow.security.jwt.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class TenantFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String jwt = extractJwt(request);

            if (jwt != null) {
                try {
                    String tenantId = jwtService.extractTenantId(jwt);
                    if (tenantId != null && !tenantId.isBlank()) {
                        TenantContext.setTenantId(tenantId);
                    }
                } catch (JwtException | IllegalArgumentException e) {
                    log.debug("TenantFilter ignora JWT invalido o expirado: {}", e.getMessage());
                }
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }

    private String extractJwt(HttpServletRequest request) {
        // Cookie primero
        if (request.getCookies() != null) {
            String fromCookie = Arrays.stream(request.getCookies())
                    .filter(c -> "jwt_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
            if (fromCookie != null && !fromCookie.isBlank()) {
                return fromCookie;
            }
        }
        // Header como fallback
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        boolean isUserRegistration = path.equals("/api/v1/users")
            && HttpMethod.POST.matches(request.getMethod());
        return path.startsWith("/api/v1/auth/")
            || isUserRegistration
            || path.startsWith("/api/v1/tenants")
            || path.contains("/swagger-ui")
            || path.contains("/v3/api-docs")
            || path.contains("/webjars")
            || path.equals("/error");
    }
}
