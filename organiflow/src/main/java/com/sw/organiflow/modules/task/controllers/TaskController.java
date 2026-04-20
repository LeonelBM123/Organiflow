package com.sw.organiflow.modules.task.controllers;

import com.sw.organiflow.modules.task.dtos.TaskCompleteRequest;
import com.sw.organiflow.modules.task.dtos.TaskResponse;
import com.sw.organiflow.modules.task.services.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'officer')")
    public ResponseEntity<List<TaskResponse>> findMine() {
        return ResponseEntity.ok(taskService.findMine());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('admin', 'officer')")
    public ResponseEntity<TaskResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(taskService.findById(id));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('officer')")
    public ResponseEntity<TaskResponse> start(@PathVariable String id) {
        return ResponseEntity.ok(taskService.start(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('officer')")
    public ResponseEntity<TaskResponse> complete(
            @PathVariable String id,
            @RequestBody TaskCompleteRequest request
    ) {
        return ResponseEntity.ok(taskService.complete(id, request));
    }

    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<TaskResponse> escalate(@PathVariable String id) {
        return ResponseEntity.ok(taskService.escalate(id));
    }

    @GetMapping("/execution/{executionId}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<List<TaskResponse>> findByExecution(@PathVariable String executionId) {
        return ResponseEntity.ok(taskService.findByExecution(executionId));
    }
}
