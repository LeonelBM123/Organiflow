package com.sw.organiflow.modules.tenant.dtos;

import com.sw.organiflow.modules.tenant.models.Tenant;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TenantResponse {

    private String id;
    private String name;
    private String slug;
    private String plan;
    private boolean isActive;
    private List<String> features;
    private LocalDateTime createdAt;

    public static TenantResponse from(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .slug(tenant.getSlug())
                .plan(tenant.getPlan())
                .isActive(tenant.isActive())
                .features(tenant.getSettings().getFeatures())
                .createdAt(tenant.getCreatedAt())
                .build();
    }
}