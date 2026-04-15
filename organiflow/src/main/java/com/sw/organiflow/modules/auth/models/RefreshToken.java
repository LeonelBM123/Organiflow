package com.sw.organiflow.modules.auth.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    @Id
    private String id;

    @Indexed(unique = true)
    @Field("token")
    private String token;

    @Field("user_id")
    private String userId;

    @Field("tenant_id")
    private String tenantId;

    @Field("role")
    private String role;

    @Field("is_revoked")
    @Builder.Default
    private boolean isRevoked = false;

    @Field("expires_at")
    private LocalDateTime expiresAt;

    @Field("created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
