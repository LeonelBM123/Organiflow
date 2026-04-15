# Organiflow — CLAUDE.md

## ¿Qué es Organiflow?
Plataforma para crear **workflows visuales basados en diagramas de actividades por carriles** (swimlane diagrams), similar a n8n. Cada workflow representa una **política de negocio** de una empresa.

Los usuarios arrastran y conectan nodos en un canvas. Cada nodo puede representar una tarea asignada a un área/departamento, con formularios definidos por el administrador.

### Ejemplo de uso
Una empresa eléctrica define el proceso de "solicitud de medidor": el workflow pasa por varios departamentos (Comercial → Técnico → Instalación), cada uno con sus tareas y formularios específicos.

---

## Actores del sistema

| Actor | Responsabilidad |
|---|---|
| **Usuario** | Solicita un servicio, ve el estado de su ejecución en tiempo real |
| **Administrador** | Crea workflows, define nodos, asigna áreas, crea formularios por nodo |
| **Funcionario** | Pertenece a un área, completa tareas asignadas, rellena formularios |

---

## Tipos de relaciones entre nodos

- **Secuencial** — Un nodo se ejecuta después del anterior
- **Condicional** — La siguiente ruta depende de una condición/decisión
- **Iterativo** — Un nodo o grupo se repite hasta cumplir una condición
- **Unión** — Múltiples flujos convergen en un único nodo

---

## Stack tecnológico

### Backend
- **Spring Boot 4**
- **MongoDB** (Spring Data MongoDB)
- **Spring Security** + **JWT** (jjwt 0.12.5) con Refresh Tokens en cookies
- **WebSocket** (para notificaciones en tiempo real de ejecución)
- **SpringDoc OpenAPI 3.0.2** (Swagger UI en `/swagger-ui/index.html`)
- **Lombok**
- **Bean Validation** (`@Valid`)
- Puerto: `8080`

### Frontend
- **Angular** (última versión estable)
- Puerto: `4200`
- Consume API en `http://localhost:8080/api`

### Infraestructura
- **MongoDB** local o Atlas
- Multitenant: cada empresa es un `Tenant`

---

## Estructura del backend

```
src/main/java/com/sw/organiflow/
├── config/               ← Configuraciones globales (Security, Mongo)
├── modules/
│   ├── auth/             ← Login, logout, refresh token
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
│   ├── tenant/           ← Modelo de empresa/organización
│   │   ├── models/
│   │   └── repositories/
│   └── user/             ← Gestión de usuarios y roles por tenant
│       ├── controllers/
│       ├── dtos/
│       ├── models/
│       ├── repositories/
│       └── services/
├── security/
│   ├── jwt/              ← JwtAuthFilter, JwtService
│   └── util/             ← CookieUtils, SecurityUtils
└── shared/
    ├── audit/            ← AuditDocument (base para documentos auditables)
    └── enums/            ← UserRole y otros enums globales
```

### Convención de paquetes para nuevos módulos
```
modules/
└── [nombre-modulo]/
    ├── controllers/    ← @RestController, mapea DTOs
    ├── dtos/           ← Records para Request y Response
    ├── models/         ← @Document de MongoDB, extiende AuditDocument
    ├── repositories/   ← interfaces MongoRepository
    └── services/       ← lógica de negocio, @Service
```

---

## Convenciones de código

### Backend
- **Lombok** en todos los modelos y servicios (`@Data`, `@Builder`, `@RequiredArgsConstructor`)
- **DTOs como Java Records** cuando son solo datos inmutables
- **Validaciones** con `@Valid` en controllers y anotaciones en DTOs (`@NotBlank`, `@Email`, etc.)
- **Modelos** extienden `AuditDocument` (tiene `createdAt`, `updatedAt`)
- **Colecciones MongoDB** en snake_case: `refresh_tokens`, `users`, `tenants`
- **Endpoints REST** en kebab-case: `/api/auth/refresh-token`, `/api/workflows`
- **Respuesta estándar de error**: usar `ProblemDetail` de Spring (RFC 7807)
- **Seguridad**: JWT en header `Authorization: Bearer <token>`, Refresh Token en cookie HttpOnly

### Frontend (Angular — por definir al iniciar)
- Componentes standalone
- Signals para manejo de estado
- Servicios con `HttpClient` e `inject()`
- Lazy loading por módulo/feature
- Carpeta `core/` para servicios globales, `features/` para módulos de negocio

---

## Inteligencia Artificial

Organiflow tiene IA integrada en dos flujos principales. **La API key de Claude NUNCA va en el frontend.**

### Flujo de comandos de voz (canvas — Administrador)
```
Browser → Web Speech API (transcripción gratuita, sin API key)
        → Angular: POST /api/ai/command  { transcript, workflowContext }
        → Spring Boot (aquí vive la API key de Claude)
        → Claude API: interpreta intención → devuelve JSON { action, params }
        → Spring Boot valida permisos y retorna al frontend
        → Angular ejecuta la acción en el canvas
```

### Flujo de formularios por voz (Funcionario)
```
Browser → Web Speech API (transcripción)
        → Angular: POST /api/ai/fill-form  { transcript, formSchema }
        → Spring Boot → Claude API: mapea texto a campos del formulario
        → Angular rellena los campos automáticamente
```

### Módulo de IA en Spring Boot
```
modules/ai/
├── controllers/AiController.java     ← POST /api/ai/command
│                                        POST /api/ai/fill-form
├── dtos/
│   ├── AiCommandRequest.java         ← { transcript, workflowContext }
│   ├── AiCommandResponse.java        ← { action, params }
│   ├── AiFillFormRequest.java        ← { transcript, formSchema }
│   └── AiFillFormResponse.java       ← { fields: { campo: valor } }
└── services/AiService.java           ← llama a Claude API, arma prompts
```

### Acciones de voz soportadas en el canvas
| Acción | Ejemplo de comando |
|--------|-------------------|
| Crear nodo | `"crea un nodo de aprobación"` |
| Eliminar nodo | `"elimina el nodo de revisión"` |
| Conectar nodos secuencial | `"conecta aprobación con notificación"` |
| Conectar nodos condicional | `"conecta revisión con aprobación de forma condicional"` |
| Conectar nodos iterativo | `"conecta validación con revisión de forma iterativa"` |
| Asignar área | `"asigna el nodo de aprobación al departamento de finanzas"` |

---

## Módulos planificados (roadmap)

- [x] `auth` — Login, registro, refresh token, logout
- [x] `user` — CRUD de usuarios, roles por tenant
- [x] `tenant` — Modelo de organización/empresa
- [ ] `workflow` — Definición de workflows (nodos, relaciones, carriles)
- [ ] `node` — Nodos del workflow con sus 4 tipos de relación
- [ ] `execution` — Instancias de ejecución de un workflow
- [ ] `task` — Tareas asignadas a funcionarios
- [ ] `form` — Formularios dinámicos por nodo
- [ ] `department` — Áreas/departamentos de un tenant
- [ ] `notification` — Notificaciones en tiempo real vía WebSocket
- [ ] `ai` — Procesamiento de voz, comandos de canvas, llenado de formularios

---

## Comandos útiles

```bash
# Backend
cd organiflow && mvn spring-boot:run
mvn test
mvn clean package

# Frontend (cuando esté iniciado)
cd organiflow-frontend && ng serve
ng test
ng build --configuration production
```

---

## Skills disponibles
- Crear nuevo módulo backend: ver `docs/skills/nuevo-modulo-backend.md`
- Crear feature Angular: ver `docs/skills/nueva-feature-angular.md`
- Crear CRUD completo (full-stack): ver `docs/skills/crud-fullstack.md`
- **Documentar una feature completa: ver `docs/skills/documentar-feature.md`**
