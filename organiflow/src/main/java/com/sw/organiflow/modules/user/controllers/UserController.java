package com.sw.organiflow.modules.user.controllers;

import com.sw.organiflow.modules.user.dtos.UserRequest;
import com.sw.organiflow.modules.user.dtos.UserResponse;
import com.sw.organiflow.modules.user.dtos.UserUpdateRequest;
import com.sw.organiflow.modules.user.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<UserResponse> createAsAdmin(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUserAsAdmin(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<UserResponse> findById(@PathVariable String id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<List<UserResponse>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<UserResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.removeFromTenant(id);
        return ResponseEntity.noContent().build();
    }
}
