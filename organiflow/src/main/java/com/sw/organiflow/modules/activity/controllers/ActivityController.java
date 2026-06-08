package com.sw.organiflow.modules.activity.controllers;

import com.sw.organiflow.modules.activity.dtos.ActivityEventResponse;
import com.sw.organiflow.modules.activity.services.ActivityEventService;
import com.sw.organiflow.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityEventService activityEventService;

    @GetMapping("/execution/{executionId}")
    public ResponseEntity<List<ActivityEventResponse>> getByExecution(@PathVariable String executionId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        return ResponseEntity.ok(activityEventService.getByExecution(tenantId, executionId));
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<ActivityEventResponse>> getByDocument(@PathVariable String documentId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        return ResponseEntity.ok(activityEventService.getByDocument(tenantId, documentId));
    }
}
