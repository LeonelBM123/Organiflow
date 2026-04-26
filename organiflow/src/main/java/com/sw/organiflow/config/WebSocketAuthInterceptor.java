package com.sw.organiflow.config;

import com.sw.organiflow.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String token = extractToken(accessor);

        if (token == null) {
            log.warn("WebSocket CONNECT rechazado: no se encontró token JWT");
            throw new MessagingException("Token JWT requerido para conectar");
        }

        if (jwtService.isTokenExpired(token)) {
            log.warn("WebSocket CONNECT rechazado: token JWT expirado");
            throw new MessagingException("Token JWT expirado");
        }

        String userId = jwtService.extractUserId(token);
        String email = jwtService.extractUsername(token);
        String tenantId = jwtService.extractTenantId(token);
        String role = jwtService.extractRole(token);

        Map<String, String> details = Map.of(
                "userId", userId,
                "tenantId", tenantId,
                "role", role,
                "email", email
        );

        // Use userId (not email) as the principal name so that
        // SimpMessagingTemplate.convertAndSendToUser(userId, ...) resolves
        // the correct STOMP session for user-specific destinations like /user/queue/sync.
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, List.of());
        authentication.setDetails(details);

        accessor.setUser(authentication);

        log.debug("WebSocket CONNECT autenticado: userId={}, tenantId={}", userId, tenantId);
        return message;
    }

    @SuppressWarnings("unchecked")
    private String extractToken(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        List<String> cookieHeaders = accessor.getNativeHeader("cookie");
        if (cookieHeaders != null) {
            for (String cookieHeader : cookieHeaders) {
                for (String cookie : cookieHeader.split(";")) {
                    String trimmed = cookie.trim();
                    if (trimmed.startsWith("access_token=")) {
                        return trimmed.substring("access_token=".length());
                    }
                }
            }
        }

        return null;
    }
}
