package com.sw.organiflow.modules.user.dtos;

import com.sw.organiflow.modules.user.models.User;
import com.sw.organiflow.modules.user.models.UserTenantRole;
import com.sw.organiflow.shared.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String avatarUrl;
    private boolean isActive;
    private UserRole role;
    private boolean activeInTenant;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static UserResponse from(User user, UserTenantRole membership) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.isActive())
                .role(membership.getRole())
                .activeInTenant(membership.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
