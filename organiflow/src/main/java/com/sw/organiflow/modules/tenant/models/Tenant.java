package com.sw.organiflow.modules.tenant.models;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.OffsetDateTime;
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

    @Field("slug")
    private String slug;

    @Field("plan")
    private String plan;

    @Field("is_active")
    @Builder.Default
    private boolean isActive = true;

    @Field("settings")
    private Settings settings;

    @Field("features")
    private List<String> features;

    @Field("created_at")
    private OffsetDateTime createdAt;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Settings {

        @Field("logo")
        private String logo;

        @Field("primary_color")
        private String primaryColor;
    }
}
