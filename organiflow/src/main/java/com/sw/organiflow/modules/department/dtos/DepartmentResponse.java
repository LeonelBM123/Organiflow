package com.sw.organiflow.modules.department.dtos;

import com.sw.organiflow.modules.department.models.Department;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DepartmentResponse {

    private String id;
    private String tenantId;
    private String name;
    private String description;
    private String headUserId;
    private List<String> memberUserIds;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DepartmentResponse from(Department d) {
        return DepartmentResponse.builder()
                .id(d.getId())
                .tenantId(d.getTenantId())
                .name(d.getName())
                .description(d.getDescription())
                .headUserId(d.getHeadUserId())
                .memberUserIds(d.getMemberUserIds())
                .isActive(d.isActive())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
