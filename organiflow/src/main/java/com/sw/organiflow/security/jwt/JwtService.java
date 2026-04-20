package com.sw.organiflow.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long expiration;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    // Access token — corta duración, lleva tenant_id y role
    public String generateAccessToken(String userId, String email, String tenantId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenant_id", tenantId);
        claims.put("role", role);
        claims.put("email", email);
        claims.put("type", "access");

        return Jwts.builder()
                .claims(claims)
                .subject(userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    // Refresh token — larga duración, mínima info
    public String generateRefreshToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("jti", UUID.randomUUID().toString());

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.get("email", String.class));
    }

    public String extractTenantId(String token) {
        return extractClaim(token, claims -> claims.get("tenant_id", String.class));
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractType(String token) {
        return extractClaim(token, claims -> claims.get("type", String.class));
    }

    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public long getExpirationMs() {
        return expiration;
    }

    public long getRefreshExpirationMs() {
        return refreshExpiration;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            final String type = extractType(token);
            return username.equals(userDetails.getUsername())
                    && !isTokenExpired(token)
                    && "access".equals(type); // Solo access tokens pasan el filtro
        } catch (Exception e) {
            log.warn("Token inválido: {}", e.getMessage());
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractClaim(token, Claims::getExpiration).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claimsResolver.apply(claims);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}