# Skill: Crear nuevo módulo backend

Usa esta guía cada vez que debas crear un nuevo módulo en `com.sw.organiflow.modules`.

## Pasos obligatorios (en orden)

### 1. Modelo (`models/`)
```java
@Document(collection = "nombre_coleccion")  // snake_case plural
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NombreEntidad extends AuditDocument {

    @Id
    private String id;

    // campos del dominio...

    // Si pertenece a un tenant:
    private String tenantId;
}
```
- Siempre extender `AuditDocument`
- `id` siempre `String` (MongoDB ObjectId)
- Incluir `tenantId` si el dato pertenece a una empresa

### 2. Repository (`repositories/`)
```java
public interface NombreRepository extends MongoRepository<NombreEntidad, String> {
    // queries personalizados con @Query si es necesario
    List<NombreEntidad> findByTenantId(String tenantId);
}
```

### 3. DTOs (`dtos/`)
```java
// Request — usar record con validaciones
public record NombreRequest(
    @NotBlank(message = "El campo es obligatorio")
    String campo,
    // más campos...
) {}

// Response — usar record
public record NombreResponse(
    String id,
    String campo,
    // más campos...
) {}
```
- Un record `*Request` para entrada
- Un record `*Response` para salida
- Nunca exponer el modelo directamente

### 4. Service (`services/`)
```java
@Service
@RequiredArgsConstructor
public class NombreService {

    private final NombreRepository nombreRepository;

    public NombreResponse crear(NombreRequest request) {
        NombreEntidad entidad = NombreEntidad.builder()
            .campo(request.campo())
            // mapeo manual...
            .build();
        NombreEntidad guardado = nombreRepository.save(entidad);
        return mapToResponse(guardado);
    }

    private NombreResponse mapToResponse(NombreEntidad entidad) {
        return new NombreResponse(entidad.getId(), entidad.getCampo());
    }
}
```
- Inyección por constructor (`@RequiredArgsConstructor`)
- Mapeo manual entre modelo ↔ DTO (no usar ModelMapper)
- Lanzar excepciones con `ResponseStatusException` o crear excepción específica

### 5. Controller (`controllers/`)
```java
@RestController
@RequestMapping("/api/nombre-recurso")  // kebab-case
@RequiredArgsConstructor
@Tag(name = "Nombre Módulo", description = "Descripción para Swagger")
public class NombreController {

    private final NombreService nombreService;

    @PostMapping
    @Operation(summary = "Crear recurso")
    public ResponseEntity<NombreResponse> crear(
        @Valid @RequestBody NombreRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(nombreService.crear(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NombreResponse> obtenerPorId(@PathVariable String id) {
        return ResponseEntity.ok(nombreService.obtenerPorId(id));
    }
}
```
- Usar `@Valid` siempre en `@RequestBody`
- Retornar `ResponseEntity<T>` con el status correcto
- Anotar con `@Tag` y `@Operation` para Swagger

### 6. Registrar en SecurityConfig
Si el endpoint es público, agregarlo en `SecurityConfig.java`:
```java
.requestMatchers("/api/nuevo-modulo/**").permitAll()
```
Si es protegido, no necesita cambios (está protegido por defecto).

---

## Checklist antes de terminar
- [ ] Modelo extiende `AuditDocument`
- [ ] DTOs son records con validaciones
- [ ] Service no expone el modelo directamente
- [ ] Controller usa `@Valid`
- [ ] Endpoint registrado en SecurityConfig si es público
- [ ] Colección en snake_case en `@Document`
