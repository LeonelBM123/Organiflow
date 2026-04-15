package com.sw.organiflow.modules.auth.controllers;

import com.sw.organiflow.modules.auth.dtos.AuthResponse;
import com.sw.organiflow.modules.auth.dtos.LoginRequest;
import com.sw.organiflow.modules.auth.dtos.LoginResponse;
import com.sw.organiflow.modules.auth.dtos.TenantSelectionRequest;
import com.sw.organiflow.modules.auth.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        LoginResponse loginResponse = authService.login(request, response);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/select-tenant")
    public ResponseEntity<AuthResponse> selectTenant(
            @Valid @RequestBody TenantSelectionRequest request,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.selectTenant(request, response);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.refresh(request, response);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        authService.logout(request, response, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada correctamente"));
    }
}