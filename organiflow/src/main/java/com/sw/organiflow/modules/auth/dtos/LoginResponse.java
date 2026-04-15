package com.sw.organiflow.modules.auth.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    private String email;
    private String name;
    private List<TenantInfo> tenants;

    private String accessToken;
    private String refreshToken;
    private String role;
    private String tenantId;

    @Getter
    @Builder
    public static class TenantInfo {
        private String tenantId;
        private String tenantName;
        private String role;
    }
}
