package com.sw.organiflow.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
//@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    public JwtAuthFilter(JwtService jwtService, @Lazy UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String token = extractToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String email = jwtService.extractUsername(token);
            String tenantId = jwtService.extractTenantId(token);
            String role = jwtService.extractRole(token);
            String userId = jwtService.extractUserId(token);

            // Solo procesamos si hay email y no hay auth previa en el contexto
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (jwtService.isTokenValid(token, userDetails)) {
                    // Construimos la auth con el role del token (ya incluye tenant context)
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    authorities
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    //guardar datos del jwt
                    var details = new java.util.HashMap<String, Object>();
                    details.put("tenant_id", tenantId);
                    details.put("role", role);
                    details.put("email", email);
                    details.put("user_id", userId);
                    authToken.setDetails(details);

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Auth OK — usuario: {}, tenant: {}, role: {}", email, tenantId, role);
                }
            }
        } catch (Exception e) {
            log.warn("Error procesando JWT: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        // 1. Intentar desde cookie (prioridad para web)
        if (request.getCookies() != null) {
            String fromCookie = Arrays.stream(request.getCookies())
                    .filter(c -> "access_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (fromCookie != null && !fromCookie.isBlank()) {
                log.debug("Token extraído desde cookie");
                return fromCookie;
            }
        }

        // 2. Fallback: header Authorization (mobile, Postman, APIs)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            log.debug("Token extraído desde Authorization header");
            return authHeader.substring(7);
        }

        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        boolean isUserRegistration = path.equals("/api/v1/users")
                && HttpMethod.POST.matches(request.getMethod());
        log.debug("shouldNotFilter path: '{}'", path);
        return path.startsWith("/api/v1/auth/")
                || isUserRegistration
                || path.startsWith("/api/v1/tenants")
                || path.contains("/swagger-ui")
                || path.contains("/v3/api-docs")
                || path.contains("/webjars")           // IMPORTANTE para CSS/JS de Swagger
                || path.equals("/error");
    }

}
