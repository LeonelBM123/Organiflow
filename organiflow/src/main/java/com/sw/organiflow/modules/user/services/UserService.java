package com.sw.organiflow.modules.user.services;

import com.sw.organiflow.modules.user.dtos.UserRequest;
import com.sw.organiflow.modules.user.dtos.UserResponse;
import com.sw.organiflow.modules.user.dtos.UserUpdateRequest;
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
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserTenantRoleRepository userTenantRoleRepository;

    /**
     * Auto-registro público (POST /api/v1/users). Sin sesión, el tenant puede ser null.
     */
    @Transactional
    public UserResponse createUser(UserRequest request) {
        return create(request, SecurityUtils.getCurrentTenantId(), SecurityUtils.getCurrentUserId());
    }

    /**
     * Alta desde el panel de administración (POST /api/v1/users/admin).
     * Asocia el nuevo usuario a la empresa del admin autenticado.
     */
    @Transactional
    public UserResponse createUserAsAdmin(UserRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            throw new RuntimeException(
                    "Tu cuenta no pertenece a ninguna empresa; no es posible crear usuarios");
        }
        return create(request, tenantId, SecurityUtils.getCurrentUserId());
    }

    private UserResponse create(UserRequest request, String tenantId, String invitedBy) {
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
                .tenantId(tenantId)
                .role(request.getRole())
                .isActive(true)
                .invitedBy(invitedBy)
                .build();
        userTenantRoleRepository.save(userTenantRole);
        log.info("Usuario creado: {} en tenant: {}", saved.getEmail(), tenantId);
        return UserResponse.from(saved, userTenantRole);
    }

    public UserResponse findById(String id) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        UserTenantRole membership = userTenantRoleRepository
                .findByUserIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "El usuario no pertenece a tu empresa"));
        return UserResponse.from(user, membership);
    }

    public List<UserResponse> findAll() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<UserTenantRole> memberships =
                userTenantRoleRepository.findByTenantIdAndIsActiveTrue(tenantId);

        Map<String, User> usersById = userRepository
                .findAllById(memberships.stream().map(UserTenantRole::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return memberships.stream()
                .filter(m -> usersById.containsKey(m.getUserId()))
                .map(m -> UserResponse.from(usersById.get(m.getUserId()), m))
                .toList();
    }

    @Transactional
    public UserResponse update(String id, UserUpdateRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        UserTenantRole membership = userTenantRoleRepository
                .findByUserIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "El usuario no pertenece a tu empresa"));

        String newEmail = request.getEmail().toLowerCase().trim();
        if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("El email ya está registrado");
        }

        user.setName(request.getName());
        user.setEmail(newEmail);
        userRepository.save(user);

        membership.setRole(request.getRole());
        membership.setActive(request.getActive());
        userTenantRoleRepository.save(membership);

        log.info("Usuario actualizado: {} en tenant: {}", user.getEmail(), tenantId);
        return UserResponse.from(user, membership);
    }

    @Transactional
    public void removeFromTenant(String id) {
        String tenantId = SecurityUtils.getCurrentTenantId();

        if (id.equals(SecurityUtils.getCurrentUserId())) {
            throw new RuntimeException("No puedes eliminar tu propia cuenta");
        }

        UserTenantRole membership = userTenantRoleRepository
                .findByUserIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "El usuario no pertenece a tu empresa"));

        userTenantRoleRepository.delete(membership);
        log.info("Usuario {} removido del tenant: {}", id, tenantId);
    }
}
