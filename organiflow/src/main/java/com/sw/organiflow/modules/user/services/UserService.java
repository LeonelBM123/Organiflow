package com.sw.organiflow.modules.user.services;

import com.sw.organiflow.modules.tenant.models.Tenant;
import com.sw.organiflow.modules.user.dtos.UserRequest;
import com.sw.organiflow.modules.user.dtos.UserResponse;
import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.models.UserTenantRole;
import com.sw.organiflow.modules.user.repositories.UserRepository;
import com.sw.organiflow.modules.user.repositories.UserTenantRoleRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserTenantRoleRepository userTenantRoleRepository;
    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        UserTenantRole userTenantRole = UserTenantRole.builder()
                .userId(saved.getId())
                .tenantId(SecurityUtils.getCurrentTenantId())
                .role(request.getRole())
                .isActive(true)
                .invitedBy(SecurityUtils.getCurrentEmail())
                .build();
        userTenantRoleRepository.save(userTenantRole);
        log.info("Usuario creado: {}", saved.getEmail());
        return UserResponse.from(saved);
    }

    public UserResponse findById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return UserResponse.from(user);
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }
}
