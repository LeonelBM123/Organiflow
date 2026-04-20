package com.sw.organiflow.modules.department.controllers;

import com.sw.organiflow.modules.department.dtos.DepartmentMemberRequest;
import com.sw.organiflow.modules.department.dtos.DepartmentRequest;
import com.sw.organiflow.modules.department.dtos.DepartmentResponse;
import com.sw.organiflow.modules.department.services.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DepartmentResponse> create(
            @Valid @RequestBody DepartmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departmentService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> findAll() {
        return ResponseEntity.ok(departmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(departmentService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DepartmentResponse> update(
            @PathVariable String id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return ResponseEntity.ok(departmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        departmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DepartmentResponse> addMember(
            @PathVariable String id,
            @Valid @RequestBody DepartmentMemberRequest request
    ) {
        return ResponseEntity.ok(departmentService.addMember(id, request.getUserId()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<DepartmentResponse> removeMember(
            @PathVariable String id,
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(departmentService.removeMember(id, userId));
    }
}
