package com.sw.organiflow.modules.tenant.models;


import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "tenants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    @Id
    private String id;

    @Field("name")
    private String name;

    @Indexed(unique = true)
    @Field("slug")
    private String slug;

    @Field("plan")
    @Builder.Default
    private String plan = "free";

    @Field("is_active")
    @Builder.Default
    private boolean isActive = true;

    @Field("settings")
    @Builder.Default
    private TenantSettings settings = new TenantSettings();

    @CreatedDate
    @Field("created_at")
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantSettings {
        private String logo;
        private String primaryColor;
        @Builder.Default
        private List<String> features = List.of();
    }
}
