# Skill: CRUD Full-Stack (Backend + Frontend)

Cuando se pida implementar un CRUD completo para una entidad, seguir ambas guías en orden.

## Orden de implementación

```
1. Backend completo primero
2. Frontend después
```

## Referencia rápida

### Backend → ver `nuevo-modulo-backend.md`
Crear en este orden:
1. `models/NombreEntidad.java` (extiende AuditDocument, incluye tenantId)
2. `repositories/NombreRepository.java`
3. `dtos/NombreRequest.java` + `NombreResponse.java` (records)
4. `services/NombreService.java` (CRUD completo)
5. `controllers/NombreController.java` (GET all, GET by id, POST, PUT, DELETE)
6. Actualizar `SecurityConfig.java` si corresponde

### Frontend → ver `nueva-feature-angular.md`
Crear en este orden:
1. `models/nombre.model.ts` (interfaz + request type)
2. `services/nombre.service.ts` (getAll, getById, create, update, delete)
3. `components/nombre-list/` (lista con signals)
4. `components/nombre-form/` (formulario reactivo)
5. `pages/nombre.page.ts`
6. Ruta lazy en `app.routes.ts`

---

## Endpoints estándar para un CRUD

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/[recurso]` | Listar todos (del tenant) |
| GET | `/api/[recurso]/{id}` | Obtener por ID |
| POST | `/api/[recurso]` | Crear nuevo |
| PUT | `/api/[recurso]/{id}` | Actualizar |
| DELETE | `/api/[recurso]/{id}` | Eliminar |

---

## Consideraciones especiales de Organiflow

- Los datos casi siempre pertenecen a un `tenantId` → incluirlo en el modelo
- Los **administradores** crean/editan/eliminan
- Los **funcionarios** solo leen o actualizan estado de tareas
- Los **usuarios** solo tienen vista de lectura de sus solicitudes
- Validar el rol con `@PreAuthorize` en el controller cuando sea necesario:
  ```java
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public ResponseEntity<NombreResponse> crear(...) { ... }
  ```
