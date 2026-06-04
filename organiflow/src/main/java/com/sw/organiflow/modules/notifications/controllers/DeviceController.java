package com.sw.organiflow.modules.notifications.controllers;

import com.sw.organiflow.modules.notifications.dto.DeviceRegistrationRequest;
import com.sw.organiflow.modules.notifications.models.UserDevice;
import com.sw.organiflow.modules.notifications.repositories.UserDeviceRepository;
import com.sw.organiflow.security.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final UserDeviceRepository userDeviceRepository;

    @GetMapping
    public ResponseEntity<List<UserDevice>> listDevices() {
        return ResponseEntity.ok(userDeviceRepository.findByUserId(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping
    public ResponseEntity<UserDevice> registerDevice(@Valid @RequestBody DeviceRegistrationRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        UserDevice device = userDeviceRepository.findByUserIdAndFcmToken(userId, request.getFcmToken())
            .map(existing -> {
                existing.setDeviceType(request.getDeviceType());
                return existing;
            })
            .orElse(UserDevice.builder()
                .userId(userId)
                .fcmToken(request.getFcmToken())
                .deviceType(request.getDeviceType())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(userDeviceRepository.save(device));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Boolean>> unregisterDevice(@Valid @RequestBody DeviceRegistrationRequest request) {
        userDeviceRepository.deleteByUserIdAndFcmToken(SecurityUtils.getCurrentUserId(), request.getFcmToken());
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
