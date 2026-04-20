# Guía de Integración Frontend — Nuevos Endpoints

> **Base URL:** `http://localhost:8080/api/v1`  
> **Auth:** Todos los endpoints requieren header `Authorization: Bearer <token>` (el interceptor de Angular ya lo agrega).  
> **Roles:** `admin` | `officer` | `user`

---

## FASE 1 — Departamentos (`/departments`)

Los departamentos representan las áreas de una empresa (Comercial, Técnico, RRHH, etc.). Un administrador los crea y asigna miembros. Los nodos del workflow se asocian a departamentos para saber quién es responsable de cada tarea.

---

### `POST /departments`
**Roles:** ADMIN  
**Crea un nuevo departamento.**

```json
// Body (Request)
{
  "name": "Departamento Técnico",         // requerido
  "description": "Área de instalaciones", // opcional
  "headUserId": "userId-del-jefe"         // opcional
}

// Response 201
{
  "id": "dept-abc123",
  "tenantId": "tenant-xyz",
  "name": "Departamento Técnico",
  "description": "Área de instalaciones",
  "headUserId": "userId-del-jefe",
  "memberUserIds": [],
  "isActive": true,
  "createdAt": "2026-04-18T21:00:00",
  "updatedAt": "2026-04-18T21:00:00"
}
```

**Sugerencia:** Usar en un modal/formulario de creación dentro del panel de administración. Mostrar error 400 si ya existe un departamento con ese nombre.

---

### `GET /departments`
**Roles:** ADMIN, OFFICER  
**Lista todos los departamentos activos del tenant.**

```json
// Response 200 — array de departamentos
[
  {
    "id": "dept-abc123",
    "name": "Departamento Técnico",
    "description": "Área de instalaciones",
    "headUserId": "userId-del-jefe",
    "memberUserIds": ["userId-1", "userId-2"],
    "isActive": true,
    "createdAt": "2026-04-18T21:00:00",
    "updatedAt": "2026-04-18T21:00:00"
  }
]
```

**Sugerencia:** Cargar al inicializar el módulo de administración y cachear con un Signal. También útil en el canvas del workflow editor para mostrar el dropdown "Asignar departamento" al configurar un nodo.

---

### `GET /departments/{id}`
**Roles:** ADMIN, OFFICER  
**Obtiene un departamento específico por su ID.**

```json
// Response 200 — mismo shape que el item de la lista
```

---

### `PUT /departments/{id}`
**Roles:** ADMIN  
**Actualiza nombre, descripción o jefe del departamento.**

```json
// Body — misma estructura que POST
{
  "name": "Área Técnica",
  "description": "Área de instalaciones y soporte",
  "headUserId": "otro-userId"
}

// Response 200 — departamento actualizado
```

---

### `DELETE /departments/{id}`
**Roles:** ADMIN  
**Elimina un departamento. Falla si tiene miembros activos.**

```
// Response 204 No Content (sin body)
// Response 400 si tiene miembros: "No se puede eliminar un departamento con miembros activos"
```

**Sugerencia:** Mostrar un dialog de confirmación antes de llamar. Si retorna 400, mostrar el mensaje de error al usuario.

---

### `POST /departments/{id}/members`
**Roles:** ADMIN  
**Agrega un usuario como miembro del departamento.**

```json
// Body
{
  "userId": "userId-del-officer"
}

// Response 200 — departamento actualizado con el nuevo miembro en memberUserIds
```

**Sugerencia:** En la vista de detalle del departamento, mostrar un selector de usuarios (cargando desde `GET /users`) y llamar a este endpoint al confirmar.

---

### `DELETE /departments/{id}/members/{userId}`
**Roles:** ADMIN  
**Quita un miembro del departamento.**

```
// Response 200 — departamento actualizado sin el usuario
```

---

## FASE 2 — Ejecuciones (`/executions`)

Una ejecución representa una instancia en curso de un workflow publicado. Un usuario final la inicia (ej: "solicitar instalación de medidor"), y el sistema avanza nodo por nodo generando tareas para los funcionarios responsables.

---

### `POST /executions`
**Roles:** USER (cualquier autenticado)  
**Inicia una nueva ejecución de un workflow publicado.**

```json
// Body
{
  "workflowId": "workflow-abc123"
}

// Response 201
{
  "id": "exec-xyz789",
  "tenantId": "tenant-xyz",
  "workflowId": "workflow-abc123",
  "workflowName": "Solicitud de Medidor",
  "workflowVersion": 3,
  "initiatedByUserId": "userId-actual",
  "status": "RUNNING",
  "currentNodeIds": ["node-tarea-comercial"],
  "executionNodes": [
    {
      "nodeId": "node-start",
      "nodeName": "Inicio",
      "nodeType": "START",
      "status": "DONE",
      "startedAt": "2026-04-18T21:00:00Z",
      "completedAt": "2026-04-18T21:00:00Z"
    },
    {
      "nodeId": "node-tarea-comercial",
      "nodeName": "Validación Comercial",
      "nodeType": "TASK",
      "status": "PENDING",
      "assignedUserId": null,
      "startedAt": "2026-04-18T21:00:00Z"
    }
  ],
  "startedAt": "2026-04-18T21:00:00Z",
  "completedAt": null
}
```

**Sugerencia:** Llamar desde la pantalla "Mis Servicios" o "Solicitar Servicio". Después de crear, redirigir al usuario a `GET /executions/{id}` para ver el estado en tiempo real.

---

### `GET /executions`
**Roles:** ADMIN, OFFICER  
**Lista todas las ejecuciones del tenant (resumen, sin detalle de nodos).**

```json
// Response 200
[
  {
    "id": "exec-xyz789",
    "workflowId": "workflow-abc123",
    "workflowName": "Solicitud de Medidor",
    "workflowVersion": 3,
    "initiatedByUserId": "userId-123",
    "status": "RUNNING",
    "currentNodeIds": ["node-tarea-comercial"],
    "startedAt": "2026-04-18T21:00:00Z",
    "completedAt": null,
    "createdAt": "2026-04-18T21:00:00"
  }
]
```

**Posibles valores de `status`:** `RUNNING` | `PAUSED` | `COMPLETED` | `FAILED` | `CANCELED`

**Sugerencia:** Usar en el panel de administración con filtros por `status`. Mostrar un badge de color por estado (verde=COMPLETED, azul=RUNNING, rojo=CANCELED).

---

### `GET /executions/my`
**Roles:** Cualquier autenticado  
**Lista solo las ejecuciones iniciadas por el usuario actual.**

```json
// Response 200 — mismo shape que GET /executions
```

**Sugerencia:** Usar en la vista "Mis Solicitudes" del usuario final para que pueda rastrear el estado de sus pedidos.

---

### `GET /executions/{id}`
**Roles:** Cualquier autenticado  
**Obtiene el detalle completo de una ejecución, incluyendo el historial de nodos.**

```json
// Response 200 — shape completo (mismo que POST /executions response)
```

**Sugerencia:** Usar para renderizar un timeline visual del proceso. Iterar `executionNodes` y mostrar cada nodo con su estado. Los nodos en `currentNodeIds` son los que están esperando acción ahora mismo.

---

### `POST /executions/{id}/cancel`
**Roles:** Cualquier autenticado  
**Cancela una ejecución en estado RUNNING o PAUSED.**

```json
// Response 200 — ejecución con status: "CANCELED"
// Response 400 si ya está COMPLETED o CANCELED
```

**Sugerencia:** Botón "Cancelar solicitud" en la vista del usuario. Pedir confirmación antes de llamar.

---

## FASE 3 — Tareas (`/tasks`)

Las tareas son las unidades de trabajo concretas que los funcionarios completan. Cuando una ejecución avanza a un nodo de tipo TASK, el backend genera automáticamente una tarea. El funcionario la toma, completa el formulario, y la ejecución avanza al siguiente nodo.

---

### `GET /tasks`
**Roles:** ADMIN, OFFICER  
**Lista las tareas disponibles para el usuario actual.**

Devuelve:
- Tareas asignadas directamente al `userId` del token (cualquier estado).
- Tareas asignadas al `role` del usuario que aún no tienen un `assignedUserId` (disponibles para tomar).

```json
// Response 200
[
  {
    "id": "task-abc",
    "tenantId": "tenant-xyz",
    "executionId": "exec-xyz789",
    "workflowId": "workflow-abc123",
    "nodeId": "node-tarea-comercial",
    "nodeName": "Validación Comercial",
    "assignedUserId": null,
    "assignedRole": "officer",
    "departmentId": null,
    "status": "PENDING",
    "formSchema": {
      "name": "Formulario Comercial",
      "fields": [
        {
          "name": "numero_cuenta",
          "label": "Número de cuenta",
          "type": "text",
          "required": true,
          "options": null
        },
        {
          "name": "tipo_servicio",
          "label": "Tipo de servicio",
          "type": "select",
          "required": true,
          "options": ["Residencial", "Comercial", "Industrial"]
        }
      ]
    },
    "formData": null,
    "dueAt": "2026-04-19T21:00:00Z",
    "completedAt": null,
    "createdAt": "2026-04-18T21:00:00",
    "updatedAt": "2026-04-18T21:00:00"
  }
]
```

**Posibles valores de `status`:** `PENDING` | `IN_PROGRESS` | `DONE` | `SKIPPED` | `ESCALATED`

**Sugerencia:** Pantalla "Mis Tareas" del funcionario. Mostrar badge de urgencia si `dueAt` está próximo. Las tareas con `assignedUserId: null` son las del pool del rol (disponibles para cualquier miembro del rol).

---

### `GET /tasks/{id}`
**Roles:** ADMIN, OFFICER  
**Obtiene el detalle completo de una tarea, con su formulario.**

```json
// Response 200 — mismo shape que el item de la lista
```

**Sugerencia:** Cargar en la vista de detalle de la tarea antes de mostrar el formulario dinámico.

---

### `POST /tasks/{id}/start`
**Roles:** OFFICER  
**El funcionario toma la tarea (pasa a IN_PROGRESS y se asigna el userId actual).**

```
// Body: vacío
// Response 200 — tarea con status: "IN_PROGRESS" y assignedUserId: "userId-actual"
```

**Sugerencia:** Botón "Tomar tarea" visible solo cuando `assignedUserId === null` o `status === 'PENDING'`. Deshabilitar si la tarea ya fue tomada por otro usuario.

---

### `POST /tasks/{id}/complete`
**Roles:** OFFICER  
**Completa la tarea enviando los datos del formulario. Avanza la ejecución al siguiente nodo.**

```json
// Body
{
  "formData": {
    "numero_cuenta": "ACC-00123",
    "tipo_servicio": "Residencial"
  }
}

// Response 200 — tarea con status: "DONE" y formData relleno
// Response 400 si falta un campo requerido: "El campo 'Número de cuenta' es requerido"
```

**Sugerencia:** El formulario dinámico se renderiza con `formSchema.fields`. Para cada field:
- `type: "text"` → `<input type="text">`
- `type: "number"` → `<input type="number">`
- `type: "select"` → `<select>` con `options`
- `type: "multiselect"` → `<select multiple>`
- `type: "date"` → `<input type="date">`
- `type: "boolean"` → `<input type="checkbox">`
- `type: "textarea"` → `<textarea>`

Validar `required` en el frontend antes de llamar al endpoint. El backend también valida y devuelve 400 si falta algún campo requerido.

---

### `POST /tasks/{id}/escalate`
**Roles:** ADMIN  
**Escala una tarea (cambia su estado a ESCALATED).**

```
// Body: vacío
// Response 200 — tarea con status: "ESCALATED"
// Response 400 si la tarea ya está DONE o SKIPPED
```

**Sugerencia:** Acción disponible solo para admins en la vista de administración de tareas. Útil cuando una tarea lleva demasiado tiempo sin completarse.

---

### `GET /tasks/execution/{executionId}`
**Roles:** ADMIN  
**Lista todas las tareas de una ejecución específica.**

```json
// Response 200 — array de tareas (mismo shape que GET /tasks)
```

**Sugerencia:** Usar en la vista de detalle de una ejecución (panel admin) para mostrar el historial completo de tareas junto con el timeline de nodos.

---

## Modelos TypeScript sugeridos

```typescript
// departments
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

// executions
export type ExecutionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type NodeType = 'START' | 'TASK' | 'CONDITION' | 'MERGE' | 'ITERATOR' | 'END';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'ESCALATED';

export interface ExecutionNode {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  status: TaskStatus;
  assignedUserId?: string;
  startedAt: string;
  completedAt?: string;
  formData?: Record<string, unknown>;
}

export interface Execution {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  initiatedByUserId: string;
  status: ExecutionStatus;
  currentNodeIds: string[];
  executionNodes: ExecutionNode[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionSummary extends Omit<Execution, 'executionNodes'> {}

// tasks
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

---

## Servicios Angular sugeridos

```typescript
// department.service.ts
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/departments';

  getAll() { return this.http.get<Department[]>(this.base); }
  getById(id: string) { return this.http.get<Department>(`${this.base}/${id}`); }
  create(body: DepartmentRequest) { return this.http.post<Department>(this.base, body); }
  update(id: string, body: DepartmentRequest) { return this.http.put<Department>(`${this.base}/${id}`, body); }
  remove(id: string) { return this.http.delete<void>(`${this.base}/${id}`); }
  addMember(id: string, userId: string) {
    return this.http.post<Department>(`${this.base}/${id}/members`, { userId });
  }
  removeMember(id: string, userId: string) {
    return this.http.delete<Department>(`${this.base}/${id}/members/${userId}`);
  }
}

// execution.service.ts
@Injectable({ providedIn: 'root' })
export class ExecutionService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/executions';

  start(workflowId: string) { return this.http.post<Execution>(this.base, { workflowId }); }
  getAll() { return this.http.get<ExecutionSummary[]>(this.base); }
  getMine() { return this.http.get<ExecutionSummary[]>(`${this.base}/my`); }
  getById(id: string) { return this.http.get<Execution>(`${this.base}/${id}`); }
  cancel(id: string) { return this.http.post<Execution>(`${this.base}/${id}/cancel`, {}); }
}

// task.service.ts
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/tasks';

  getMine() { return this.http.get<Task[]>(this.base); }
  getById(id: string) { return this.http.get<Task>(`${this.base}/${id}`); }
  startTask(id: string) { return this.http.post<Task>(`${this.base}/${id}/start`, {}); }
  complete(id: string, formData: Record<string, unknown>) {
    return this.http.post<Task>(`${this.base}/${id}/complete`, { formData });
  }
  escalate(id: string) { return this.http.post<Task>(`${this.base}/${id}/escalate`, {}); }
  getByExecution(executionId: string) {
    return this.http.get<Task[]>(`${this.base}/execution/${executionId}`);
  }
}
```

---

## Flujos principales de pantallas

### Flujo del usuario final
```
Pantalla "Solicitar Servicio"
  → GET /workflows (publicados)
  → Selecciona workflow
  → POST /executions { workflowId }
  → Redirige a "Mis Solicitudes"

Pantalla "Mis Solicitudes"
  → GET /executions/my
  → Lista de ejecuciones con badge de status
  → Click en una → GET /executions/{id}
  → Muestra timeline de nodos (executionNodes)
  → Botón "Cancelar" → POST /executions/{id}/cancel
```

### Flujo del funcionario
```
Pantalla "Mis Tareas"
  → GET /tasks
  → Lista de tareas PENDING/IN_PROGRESS
  → Click en tarea → GET /tasks/{id}
  → Si status=PENDING y assignedUserId=null → Botón "Tomar"
      → POST /tasks/{id}/start
  → Si status=IN_PROGRESS → Muestra formulario dinámico (formSchema.fields)
      → Completa campos → POST /tasks/{id}/complete { formData }
      → La ejecución avanza automáticamente al siguiente nodo
```

### Flujo del administrador
```
Pantalla "Departamentos"
  → GET /departments
  → CRUD: POST / PUT / DELETE
  → Gestión de miembros: POST y DELETE /departments/{id}/members

Pantalla "Ejecuciones (admin)"
  → GET /executions (con filtro de status)
  → Click en una → GET /executions/{id} + GET /tasks/execution/{id}
  → Vista combinada: timeline de nodos + lista de tareas
  → Puede escalar tareas: POST /tasks/{id}/escalate
```
