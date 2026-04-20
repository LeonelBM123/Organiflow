package com.sw.organiflow.modules.tenant.services;

import com.sw.organiflow.modules.tenant.dtos.TenantRegisterRequest;
import com.sw.organiflow.modules.tenant.dtos.TenantResponse;
import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.tenant.repositories.TenantRepository;
import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.models.UserTenantRole;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.modules.user.repositories.UserTenantRoleRepository;
import com.sw.organiflow.shared.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public TenantResponse register(TenantRegisterRequest request) {

        if (tenantRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("El slug ya está en uso");
        }

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Tenant tenant = Tenant.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .plan("free")
                .isActive(true)
                .build();

        Tenant savedTenant = tenantRepository.save(tenant);

        User admin = User.builder()
                .name(request.getAdminName())
                .email(request.getAdminEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .isActive(true)
                .build();

        User savedAdmin = userRepository.save(admin);

        UserTenantRole role = UserTenantRole.builder()
                .userId(savedAdmin.getId())
                .tenantId(savedTenant.getId())
                .role(UserRole.admin)
                .isActive(true)
                .build();

        userTenantRoleRepository.save(role);

        log.info("Tenant registrado: {} con admin: {}", savedTenant.getSlug(), savedAdmin.getEmail());

        return TenantResponse.from(savedTenant);
    }

    public TenantResponse findById(String id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return TenantResponse.from(tenant);
    }
}