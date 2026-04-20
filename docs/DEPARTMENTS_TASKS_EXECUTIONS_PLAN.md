# Plan de Implementación Frontend — Departamentos, Tareas y Ejecuciones

> **Estado actual:** Las carpetas de los 3 módulos ya existen en `features/` pero están vacías.
> Las rutas apuntan a componentes placeholder (dashboards).
> Los endpoints del backend ya están disponibles en `http://localhost:8080/api/v1`.
>
> **Referencia de API:** ver `docs/API_INTEGRATION_GUIDE.md`
> **Convenciones Angular:** standalone, signals, OnPush, `inject()`, reactive forms, `@if/@for`.

---

## Convenciones obligatorias (leer antes de implementar)

- **Sin `standalone: true`** en el decorador (Angular v20+, es el default).
- **Signals** para todo el estado local (`signal()`, `computed()`).
- **`inject()`** en vez de constructor injection.
- **`ChangeDetectionStrategy.OnPush`** en todos los componentes.
- **`input()` / `output()`** en vez de `@Input` / `@Output`.
- **Reactive Forms** (no template-driven).
- **`class` binding** en vez de `ngClass`; **`style` binding** en vez de `ngStyle`.
- **`@if / @for / @switch`** (control flow nativo, no directivas estructurales).
- Archivos de estilos con variables CSS del design system (`var(--surface-1)`, `var(--primary-500)`, etc.).

---

## MÓDULO 1 — Departamentos

### Rutas a implementar

Actualizar `app.routes.ts` — reemplazar el placeholder de `admin/departments`:

```
/admin/departments              → DepartmentListComponent
/admin/departments/:id          → DepartmentDetailComponent
```

### Archivos a crear

```
features/departments/
├── models/
│   └── department.model.ts
├── services/
│   └── department.service.ts
└── components/
    ├── department-list/
    │   ├── department-list.component.ts
    │   ├── department-list.component.html
    │   └── department-list.component.scss
    ├── department-detail/
    │   ├── department-detail.component.ts
    │   ├── department-detail.component.html
    │   └── department-detail.component.scss
    └── department-form/              ← modal reutilizable (crear/editar)
        ├── department-form.component.ts
        ├── department-form.component.html
        └── department-form.component.scss
```

### `department.model.ts`

```typescript
export interface Department {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  headUserId?: string;
  memberUserIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  name: string;
  description?: string;
  headUserId?: string;
}
```

### `department.service.ts`

Servicio con `providedIn: 'root'`. Métodos:

| Método | HTTP | Endpoint |
|--------|------|----------|
| `getAll()` | GET | `/departments` |
| `getById(id)` | GET | `/departments/{id}` |
| `create(body)` | POST | `/departments` |
| `update(id, body)` | PUT | `/departments/{id}` |
| `remove(id)` | DELETE | `/departments/{id}` → 204 |
| `addMember(id, userId)` | POST | `/departments/{id}/members` |
| `removeMember(id, userId)` | DELETE | `/departments/{id}/members/{userId}` |

### `DepartmentListComponent` — pantalla principal (ADMIN)

**Estado:**
```typescript
departments = signal<Department[]>([]);
loading = signal(false);
showFormModal = signal(false);
editingDepartment = signal<Department | null>(null);
```

**UI a implementar:**
- Header con título "Departamentos" + botón "Nuevo departamento" (solo ADMIN).
- Tabla/grid de departamentos: nombre, descripción, jefe, nº miembros, estado activo/inactivo.
- Botón "Editar" → abre `DepartmentFormComponent` en modo edición.
- Botón "Eliminar" → dialog de confirmación → DELETE. Si responde 400 (tiene miembros), mostrar el mensaje de error.
- Click en fila → navega a `/admin/departments/:id`.

### `DepartmentDetailComponent` — detalle + gestión de miembros

**Estado:**
```typescript
department = signal<Department | null>(null);
loading = signal(false);
```

**UI a implementar:**
- Header con nombre del departamento + breadcrumb de vuelta a la lista.
- Sección de info (descripción, jefe, estado).
- Lista de miembros (`memberUserIds`). Para mostrar nombres necesita cruzar con `GET /users` (o mostrar solo el ID si el endpoint de usuarios no está listo aún).
- Botón "Agregar miembro" → input con userId → POST `/departments/{id}/members`.
- Botón "Quitar" por cada miembro → DELETE `/departments/{id}/members/{userId}`.

### `DepartmentFormComponent` — modal crear/editar

- `ReactiveForm` con campos: `name` (requerido), `description` (opcional), `headUserId` (opcional).
- Inputs: `department = input<Department | null>(null)` (null = modo crear).
- Outputs: `saved = output<Department>()`, `cancelled = output<void>()`.
- Al submit llama `create()` o `update()` según si hay `department` input.

---

## MÓDULO 2 — Tareas

### Rutas a implementar

Actualizar `app.routes.ts` — reemplazar el placeholder de `officer/tasks`:

```
/officer/tasks                  → TaskListComponent
/officer/tasks/:id              → TaskDetailComponent
/admin/executions/:id/tasks     → TasksByExecutionComponent  (ver módulo 3)
```

### Archivos a crear

```
features/tasks/
├── models/
│   └── task.model.ts
├── services/
│   └── task.service.ts
└── components/
    ├── task-list/
    │   ├── task-list.component.ts
    │   ├── task-list.component.html
    │   └── task-list.component.scss
    ├── task-detail/
    │   ├── task-detail.component.ts
    │   ├── task-detail.component.html
    │   └── task-detail.component.scss
    └── dynamic-form/             ← formulario dinámico reutilizable
        ├── dynamic-form.component.ts
        ├── dynamic-form.component.html
        └── dynamic-form.component.scss
```

### `task.model.ts`

```typescript
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'ESCALATED';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'boolean' | 'textarea';
  required: boolean;
  options?: string[];
  sortOrder?: number;
}

export interface FormSchema {
  name: string;
  fields: FormField[];
}

export interface Task {
  id: string;
  tenantId: string;
  executionId: string;
  workflowId: string;
  nodeId: string;
  nodeName: string;
  assignedUserId?: string;
  assignedRole?: string;
  departmentId?: string;
  status: TaskStatus;
  formSchema?: FormSchema;
  formData?: Record<string, unknown>;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `task.service.ts`

| Método | HTTP | Endpoint | Roles |
|--------|------|----------|-------|
| `getMine()` | GET | `/tasks` | ADMIN, OFFICER |
| `getById(id)` | GET | `/tasks/{id}` | ADMIN, OFFICER |
| `start(id)` | POST | `/tasks/{id}/start` | OFFICER |
| `complete(id, formData)` | POST | `/tasks/{id}/complete` | OFFICER |
| `escalate(id)` | POST | `/tasks/{id}/escalate` | ADMIN |
| `getByExecution(executionId)` | GET | `/tasks/execution/{executionId}` | ADMIN |

### `TaskListComponent` — pantalla "Mis Tareas" (OFFICER)

**Estado:**
```typescript
tasks = signal<Task[]>([]);
loading = signal(false);
filter = signal<TaskStatus | 'ALL'>('ALL');
filteredTasks = computed(() => filter() === 'ALL' ? tasks() : tasks().filter(t => t.status === filter()));
```

**UI a implementar:**
- Tabs o filtro por status: Todas / Pendientes / En progreso / Completadas.
- Card por tarea: nombre del nodo, workflow, status badge, fecha límite (`dueAt`).
  - Si `dueAt` está dentro de 24h → mostrar badge de urgencia (color rojo/naranja).
  - Si `assignedUserId === null` → badge "Disponible" (cualquiera del rol puede tomarla).
- Click en card → navega a `/officer/tasks/:id`.

**Lógica de status badge:**

| Status | Color/estilo |
|--------|-------------|
| PENDING | gris |
| IN_PROGRESS | azul |
| DONE | verde |
| SKIPPED | gris claro |
| ESCALATED | naranja |

### `TaskDetailComponent` — detalle + acciones + formulario

**Estado:**
```typescript
task = signal<Task | null>(null);
loading = signal(false);
submitting = signal(false);
form: FormGroup  // construido dinámicamente desde formSchema
```

**UI a implementar:**

1. Header con nombre del nodo, badge de status, breadcrumb.
2. Info: workflow, ejecutado por, fecha límite.
3. **Botón "Tomar tarea"** — visible si `status === 'PENDING' && !assignedUserId`.
   - Llama `start(id)` → actualiza el signal `task`.
4. **Formulario dinámico** — visible si `status === 'IN_PROGRESS'`.
   - Renderizado desde `formSchema.fields` (ver `DynamicFormComponent`).
   - Botón "Completar tarea" → `complete(id, formData)`.
   - Validar `required` en el frontend antes de llamar.
5. **Vista de solo lectura** si `status === 'DONE'` — mostrar `formData` rellenado.

### `DynamicFormComponent` — formulario genérico reutilizable

Recibe `formSchema = input<FormSchema>()` y emite `submitted = output<Record<string, unknown>>()`.

Construir un `FormGroup` dinámico en `effect(() => { ... })` cuando cambie el input.

Mapeo de tipos a controles HTML:

| `field.type` | Control Angular | Elemento HTML |
|---|---|---|
| `text` | `FormControl('')` | `<input type="text">` |
| `number` | `FormControl(null)` | `<input type="number">` |
| `select` | `FormControl('')` | `<select>` con `@for (opt of field.options)` |
| `multiselect` | `FormControl([])` | `<select multiple>` |
| `date` | `FormControl('')` | `<input type="date">` |
| `boolean` | `FormControl(false)` | `<input type="checkbox">` con toggle |
| `textarea` | `FormControl('')` | `<textarea>` |

Agregar `Validators.required` si `field.required === true`.

---

## MÓDULO 3 — Ejecuciones

### Rutas a implementar

```
/user/executions                → ExecutionListComponent   (usuario ve sus solicitudes)
/user/executions/:id            → ExecutionDetailComponent
/user/new-request               → NewRequestComponent      (iniciar una ejecución)
/admin/executions               → ExecutionListComponent   (admin ve todas)
/admin/executions/:id           → ExecutionDetailComponent
```

### Archivos a crear

```
features/executions/
├── models/
│   └── execution.model.ts
├── services/
│   └── execution.service.ts
└── components/
    ├── execution-list/
    │   ├── execution-list.component.ts
    │   ├── execution-list.component.html
    │   └── execution-list.component.scss
    ├── execution-detail/
    │   ├── execution-detail.component.ts
    │   ├── execution-detail.component.html
    │   └── execution-detail.component.scss
    ├── execution-timeline/       ← componente visual del progreso
    │   ├── execution-timeline.component.ts
    │   ├── execution-timeline.component.html
    │   └── execution-timeline.component.scss
    └── new-request/
        ├── new-request.component.ts
        ├── new-request.component.html
        └── new-request.component.scss
```

### `execution.model.ts`

```typescript
export type ExecutionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type NodeType = 'START' | 'TASK' | 'CONDITION' | 'MERGE' | 'ITERATOR' | 'END';

export interface ExecutionNode {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'ESCALATED';
  assignedUserId?: string;
  startedAt: string;
  completedAt?: string;
  formData?: Record<string, unknown>;
}

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  initiatedByUserId: string;
  status: ExecutionStatus;
  currentNodeIds: string[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface Execution extends ExecutionSummary {
  tenantId: string;
  executionNodes: ExecutionNode[];
  updatedAt: string;
}
```

### `execution.service.ts`

| Método | HTTP | Endpoint | Roles |
|--------|------|----------|-------|
| `start(workflowId)` | POST | `/executions` | Cualquier autenticado |
| `getAll()` | GET | `/executions` | ADMIN, OFFICER |
| `getMine()` | GET | `/executions/my` | Cualquier autenticado |
| `getById(id)` | GET | `/executions/{id}` | Cualquier autenticado |
| `cancel(id)` | POST | `/executions/{id}/cancel` | Cualquier autenticado |

### `ExecutionListComponent` — lista de solicitudes

Funciona para dos roles con el mismo componente. La diferencia es el endpoint que usa:
- **USER** → `getMine()` (solo las suyas)
- **ADMIN/OFFICER** → `getAll()` (todas del tenant)

La lógica de qué endpoint llamar se puede resolver con `inject(AuthService).role()`.

**Estado:**
```typescript
executions = signal<ExecutionSummary[]>([]);
loading = signal(false);
statusFilter = signal<ExecutionStatus | 'ALL'>('ALL');
filtered = computed(() => ...);
```

**UI a implementar:**
- Filtro por status (tabs o dropdown).
- Card/fila por ejecución: nombre workflow, versión, status badge, fecha inicio.
- Click → navega a `/:role/executions/:id`.

**Status badge colors:**

| Status | Color |
|--------|-------|
| RUNNING | azul |
| PAUSED | amarillo |
| COMPLETED | verde |
| FAILED | rojo |
| CANCELED | gris |

### `ExecutionDetailComponent` — detalle + timeline + tareas

**Estado:**
```typescript
execution = signal<Execution | null>(null);
tasks = signal<Task[]>([]);    // solo admin: GET /tasks/execution/{id}
loading = signal(false);
```

**UI a implementar:**
1. Header: nombre workflow, status badge, fecha inicio/fin.
2. **`ExecutionTimelineComponent`** embebido — visualiza el progreso por nodos.
3. Si `status === 'RUNNING'` → botón "Cancelar solicitud" con dialog de confirmación.
4. Si rol ADMIN → sección de tareas al pie (usando `getByExecution(id)`), con botón "Escalar" por cada tarea activa.

### `ExecutionTimelineComponent` — visualizador de progreso

Recibe `nodes = input<ExecutionNode[]>()` y `currentNodeIds = input<string[]>()`.

Renderiza una lista vertical de pasos:

```
[✓] Inicio                   DONE
[→] Validación Comercial      IN_PROGRESS  ← nodo activo
[ ] Aprobación Técnica        PENDING
[ ] Fin                       PENDING
```

Icono/color por status de cada `ExecutionNode`:
- `DONE` → check verde
- `IN_PROGRESS` → spinner azul (el nodo activo, está en `currentNodeIds`)
- `PENDING` → círculo gris vacío
- `SKIPPED` → dash gris
- `ESCALATED` → exclamación naranja

### `NewRequestComponent` — iniciar una ejecución (USER)

**Estado:**
```typescript
workflows = signal<WorkflowSummary[]>([]);  // GET /api/v1/workflows/published
loading = signal(false);
submitting = signal(false);
```

**UI a implementar:**
- Lista o grid de workflows publicados disponibles.
- Card por workflow: nombre, descripción, versión.
- Botón "Solicitar" → `execution.service.start(workflow.id)` → redirige a `/user/executions/:id`.

---

## Orden de implementación sugerido

1. **Modelos y servicios** de los 3 módulos (sin UI aún) — base que los componentes necesitan.
2. **Rutas** — actualizar `app.routes.ts` con los componentes reales.
3. **Departamentos** completo (más simple, no depende de los otros).
4. **Executions list + detail + timeline** — el usuario y admin los necesitan.
5. **Tasks list + detail** — depende de executions para algunos flujos.
6. **DynamicForm** — puede implementarse en paralelo con task-detail.
7. **NewRequest** — depende de workflows publicados.

---

## Actualización de rutas (`app.routes.ts`)

Cambios necesarios en las rutas existentes:

```typescript
// ADMIN
{
  path: 'departments',
  loadComponent: () =>
    import('./features/departments/components/department-list/department-list.component')
      .then(m => m.DepartmentListComponent)
},
{
  path: 'departments/:id',
  loadComponent: () =>
    import('./features/departments/components/department-detail/department-detail.component')
      .then(m => m.DepartmentDetailComponent)
},
{
  path: 'executions',
  loadComponent: () =>
    import('./features/executions/components/execution-list/execution-list.component')
      .then(m => m.ExecutionListComponent)
},
{
  path: 'executions/:id',
  loadComponent: () =>
    import('./features/executions/components/execution-detail/execution-detail.component')
      .then(m => m.ExecutionDetailComponent)
},

// OFFICER
{
  path: 'tasks',
  loadComponent: () =>
    import('./features/tasks/components/task-list/task-list.component')
      .then(m => m.TaskListComponent)
},
{
  path: 'tasks/:id',
  loadComponent: () =>
    import('./features/tasks/components/task-detail/task-detail.component')
      .then(m => m.TaskDetailComponent)
},

// USER
{
  path: 'executions',
  loadComponent: () =>
    import('./features/executions/components/execution-list/execution-list.component')
      .then(m => m.ExecutionListComponent)
},
{
  path: 'executions/:id',
  loadComponent: () =>
    import('./features/executions/components/execution-detail/execution-detail.component')
      .then(m => m.ExecutionDetailComponent)
},
{
  path: 'new-request',
  loadComponent: () =>
    import('./features/executions/components/new-request/new-request.component')
      .then(m => m.NewRequestComponent)
},
```

---

## Notas importantes

- **`complete()` requiere `IN_PROGRESS` previo.** El flujo obligatorio es: tomar (`start`) → completar (`complete`). Si una tarea está en `PENDING`, el botón de completar no debe existir.
- **Pool de tareas.** Una tarea con `assignedUserId === null` y `assignedRole === 'officer'` aparece en la lista de cualquier officer (la puede tomar el primero que llegue). Después del `start`, ya tiene `assignedUserId` y desaparece del pool de los demás.
- **`GET /executions` vs `GET /executions/my`.** El admin ve todas; el usuario solo las suyas. El componente `ExecutionListComponent` puede recibir un `input()` `mode: 'all' | 'mine'` para reutilizarlo en ambas rutas.
- **El timeline usa `executionNodes` del detalle** (no del summary). No llamar a `getById()` en la lista; solo al entrar al detalle.
- **Los formularios dinámicos validan en cliente primero.** Si el backend devuelve 400 con mensaje `"El campo 'X' es requerido"`, mostrarlo como error junto al campo correspondiente.
