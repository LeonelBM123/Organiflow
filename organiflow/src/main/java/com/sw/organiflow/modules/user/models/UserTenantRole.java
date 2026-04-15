package com.sw.organiflow.modules.user.models;

import com.sw.organiflow.shared.enums.UserRole;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.LocalDateTime;

@Document(collection = "user_tenant_roles")
@CompoundIndexes({
        @CompoundIndex(name = "idx_user_tenant_unique",
                def = "{'user_id': 1, 'tenant_id': 1}",
                unique = true),
        @CompoundIndex(name = "idx_tenant_role",
                def = "{'tenant_id': 1, 'role': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserTenantRole {
    @Id
    private String id;

    @Field(value = "user_id", targetType = FieldType.OBJECT_ID)
    private String userId;

    @Field(value = "tenant_id", targetType = FieldType.OBJECT_ID)
    private String tenantId;

    @Field("role")
    private UserRole role;

    @Field("is_active")
    @Builder.Default
    private boolean isActive = true;

    @Field(value = "invited_by", targetType = FieldType.OBJECT_ID)
    private String invitedBy;

    @Field("joined_at")
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}
