package com.sw.organiflow.config;

import com.sw.organiflow.security.jwt.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

import org.springframework.web.filter.OncePerRequestFilter;

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
                String tenantId = jwtService.extractTenantId(jwt);
                if (tenantId != null && !tenantId.isBlank()) {
                    TenantContext.setTenantId(tenantId);
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
            return Arrays.stream(request.getCookies())
                    .filter(c -> "jwt_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }
        // Header como fallback
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
