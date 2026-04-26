# Frontend changes — Department-based task assignment

## Context

The backend no longer assigns tasks by role (`assignedRole`). Tasks now require a **department** (mandatory) and optionally a **specific user** from that department. These changes must be reflected in the workflow editor and in the task-facing views.

---

## 1. TypeScript model — `WorkflowNode`

File: `src/app/features/workflows/models/workflow.model.ts` (or wherever `WorkflowNode` is defined)

```typescript
// REMOVE:
assignedRole?: string;

// ADD:
departmentId?: string;        // required when node is TASK or ITERATOR
assignedUserId?: string;      // optional override — specific user within the department
```

---

## 2. `workflow.mapper.ts`

File: `src/app/features/workflows/services/workflow.mapper.ts`

In the serialization (`toBackendNode`) and deserialization (`fromBackendNode`) sections, replace every reference to `assignedRole` with `departmentId`.

```typescript
// BEFORE (serialization):
assignedRole: node.assignedRole,

// AFTER:
departmentId: node.departmentId,
assignedUserId: node.assignedUserId,   // already present — keep it
```

```typescript
// BEFORE (deserialization from backend):
assignedRole: raw.assignedRole,

// AFTER:
departmentId: raw.departmentId,
assignedUserId: raw.assignedUserId,   // already present — keep it
```

---

## 3. `NodePanelComponent`

File: `src/app/features/workflows/components/workflow-editor/node-panel/node-panel.component.*`

### 3a. New `input()` signals

```typescript
departments = input<Department[]>([]);   // injected from editor parent
users       = input<User[]>([]);         // all tenant users — needed to resolve member names
```

### 3b. Replace "Rol asignado" field

Remove the text input for `assignedRole`. Replace with two cascading selects, **only visible when the selected node is TASK or ITERATOR**:

#### Departamento (obligatorio)
```html
<label for="dept-select">Departamento *</label>
<select id="dept-select"
        [value]="selectedNode()?.departmentId ?? ''"
        (change)="onDepartmentChange($event)">
  <option value="">— Selecciona un departamento —</option>
  @for (dept of departments(); track dept.id) {
    <option [value]="dept.id">{{ dept.name }}</option>
  }
</select>
```

#### Usuario específico (opcional)
```html
<label for="user-select">Usuario específico (opcional)</label>
<select id="user-select"
        [disabled]="!selectedNode()?.departmentId"
        [value]="selectedNode()?.assignedUserId ?? ''"
        (change)="onAssignedUserChange($event)">
  <option value="">— Cualquier miembro del departamento —</option>
  @for (member of departmentMembers(); track member.id) {
    <option [value]="member.id">{{ member.name }}</option>
  }
</select>
```

### 3c. Computed signal for department members

```typescript
departmentMembers = computed(() => {
  const deptId = this.selectedNode()?.departmentId;
  if (!deptId) return [];
  const dept = this.departments().find(d => d.id === deptId);
  if (!dept) return [];
  return this.users().filter(u => dept.memberUserIds.includes(u.id));
});
```

### 3d. Change handlers

```typescript
onDepartmentChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  this.patchSelectedNode({ departmentId: value || undefined, assignedUserId: undefined });
}

onAssignedUserChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  this.patchSelectedNode({ assignedUserId: value || undefined });
}
```

---

## 4. `WorkflowEditorComponent`

File: `src/app/features/workflows/components/workflow-editor/workflow-editor.component.ts`

### 4a. Load departments on init

```typescript
private readonly departmentService = inject(DepartmentService);
private readonly userService = inject(UserService);   // if it exists

departments = signal<Department[]>([]);
tenantUsers = signal<User[]>([]);

ngOnInit() {
  // existing init logic…
  this.departmentService.getAll().subscribe(d => this.departments.set(d));
  this.userService.getAll().subscribe(u => this.tenantUsers.set(u));
}
```

### 4b. Pass to `NodePanelComponent` in the template

```html
<app-node-panel
  [selectedNode]="selectedNode()"
  [departments]="departments()"
  [users]="tenantUsers()"
  (nodeChange)="onNodeChange($event)" />
```

---

## 5. `DepartmentService` (if not already created)

File: `src/app/features/workflows/services/department.service.ts` (or `core/`)

```typescript
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>('/api/departments');
  }

  getById(id: string): Observable<Department> {
    return this.http.get<Department>(`/api/departments/${id}`);
  }
}
```

---

## 6. `Department` model

```typescript
export interface Department {
  id: string;
  name: string;
  description?: string;
  headUserId?: string;
  memberUserIds: string[];
  isActive: boolean;
}
```

---

## API endpoints used

| Endpoint | Purpose |
|---|---|
| `GET /api/departments` | List all active departments for the tenant |
| `GET /api/departments/{id}` | Get department details (members) |
| `GET /api/users` | List tenant users (for name resolution) |

---

## Backwards compatibility

Existing workflows saved with `assignedRole` will have that field ignored by the backend (field removed from `WorkflowNode`). The admin should re-open and re-save affected workflows to set a `departmentId` before publishing.
