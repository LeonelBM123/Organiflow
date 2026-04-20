package com.sw.organiflow.modules.execution.controllers;

import com.sw.organiflow.modules.execution.dtos.ExecutionRequest;
import com.sw.organiflow.modules.execution.dtos.ExecutionResponse;
import com.sw.organiflow.modules.execution.dtos.ExecutionSummaryResponse;
import com.sw.organiflow.modules.execution.services.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/executions")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping
    public ResponseEntity<ExecutionResponse> start(
            @Valid @RequestBody ExecutionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(executionService.start(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<List<ExecutionSummaryResponse>> findAll() {
        return ResponseEntity.ok(executionService.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<ExecutionSummaryResponse>> findMine() {
        return ResponseEntity.ok(executionService.findMine());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExecutionResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(executionService.findById(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ExecutionResponse> cancel(@PathVariable String id) {
        return ResponseEntity.ok(executionService.cancel(id));
    }
}
