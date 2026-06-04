package com.sw.organiflow.modules.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeviceRegistrationRequest {
    @NotBlank
    private String fcmToken;

    @NotBlank
    private String deviceType;
}
