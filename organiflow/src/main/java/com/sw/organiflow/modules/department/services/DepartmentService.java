package com.sw.organiflow.modules.department.services;

import com.sw.organiflow.config.TenantContext;
import com.sw.organiflow.modules.department.dtos.DepartmentRequest;
import com.sw.organiflow.modules.department.dtos.DepartmentResponse;
import com.sw.organiflow.modules.department.models.Department;
import com.sw.organiflow.modules.department.repositories.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentResponse create(DepartmentRequest request) {
        String tenantId = TenantContext.getTenantId();

        if (departmentRepository.existsByTenantIdAndName(tenantId, request.getName())) {
            throw new RuntimeException("Ya existe un departamento con ese nombre en tu empresa");
        }

        Department department = Department.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .headUserId(request.getHeadUserId())
                .build();

        Department saved = departmentRepository.save(department);
        log.info("Departamento creado: {} en tenant: {}", saved.getId(), tenantId);
        return DepartmentResponse.from(saved);
    }

    public List<DepartmentResponse> findAll() {
        String tenantId = TenantContext.getTenantId();
        return departmentRepository.findByTenantIdAndIsActiveTrue(tenantId)
                .stream()
                .map(DepartmentResponse::from)
                .toList();
    }

    public DepartmentResponse findById(String id) {
        return DepartmentResponse.from(findByIdAndTenant(id));
    }

    public DepartmentResponse update(String id, DepartmentRequest request) {
        Department department = findByIdAndTenant(id);

        String tenantId = TenantContext.getTenantId();
        if (!department.getName().equals(request.getName()) &&
                departmentRepository.existsByTenantIdAndName(tenantId, request.getName())) {
            throw new RuntimeException("Ya existe un departamento con ese nombre en tu empresa");
        }

        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setHeadUserId(request.getHeadUserId());

        return DepartmentResponse.from(departmentRepository.save(department));
    }

    public void delete(String id) {
        Department department = findByIdAndTenant(id);

        if (!department.getMemberUserIds().isEmpty()) {
            throw new RuntimeException(
                    "No se puede eliminar un departamento con miembros activos. " +
                    "Remueve los miembros primero."
            );
        }

        departmentRepository.delete(department);
        log.info("Departamento eliminado: {}", id);
    }

    public DepartmentResponse addMember(String id, String userId) {
        Department department = findByIdAndTenant(id);

        if (department.getMemberUserIds().contains(userId)) {
            throw new RuntimeException("El usuario ya es miembro de este departamento");
        }

        department.getMemberUserIds().add(userId);
        return DepartmentResponse.from(departmentRepository.save(department));
    }

    public DepartmentResponse removeMember(String id, String userId) {
        Department department = findByIdAndTenant(id);

        if (!department.getMemberUserIds().remove(userId)) {
            throw new RuntimeException("El usuario no es miembro de este departamento");
        }

        return DepartmentResponse.from(departmentRepository.save(department));
    }

    private Department findByIdAndTenant(String id) {
        String tenantId = TenantContext.getTenantId();
        return departmentRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException(
                        "Departamento no encontrado o no pertenece a tu empresa"
                ));
    }
}
