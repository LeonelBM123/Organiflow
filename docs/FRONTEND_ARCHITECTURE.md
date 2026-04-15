# Arquitectura del Frontend - Organiflow

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Convenciones y Buenas Prácticas](#convenciones-y-buenas-prácticas)
5. [Módulos Principales](#módulos-principales)
6. [Gestión de Estado](#gestión-de-estado)
7. [Routing y Lazy Loading](#routing-y-lazy-loading)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Integración con Backend](#integración-con-backend)
10. [Guía de Desarrollo](#guía-de-desarrollo)

---

## Introducción

El frontend de Organiflow está construido con **Angular** (última versión estable) siguiendo una arquitectura modular, escalable y mantenible. El proyecto utiliza componentes standalone, signals para el manejo de estado reactivo, y lazy loading para optimizar el rendimiento.

### Objetivos de la arquitectura

- **Modularidad**: Separación clara de responsabilidades por features
- **Escalabilidad**: Estructura preparada para crecer sin refactorización masiva
- **Reutilización**: Componentes y servicios compartidos a través de toda la aplicación
- **Mantenibilidad**: Código limpio, organizado y fácil de entender
- **Performance**: Lazy loading, tree shaking, y optimizaciones de Angular

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Angular** | 18+ | Framework principal |
| **TypeScript** | 5.x | Lenguaje de programación |
| **TailwindCSS** | 3.x | Framework CSS utility-first |
| **RxJS** | 7.x | Programación reactiva |
| **Angular Signals** | Nativo | Gestión de estado reactivo |
| **Web Speech API** | Nativo | Reconocimiento de voz para IA |
| **HttpClient** | Nativo | Consumo de API REST |
| **WebSocket** | Nativo | Notificaciones en tiempo real |

### Dependencias principales

```json
{
  "@angular/core": "^18.0.0",
  "@angular/common": "^18.0.0",
  "@angular/router": "^18.0.0",
  "@angular/forms": "^18.0.0",
  "rxjs": "^7.8.0",
  "tailwindcss": "^3.4.0"
}
```

---

## Estructura de Carpetas

```
organiflow-frontend/
├── public/                          # Archivos estáticos
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── app/
│   │   ├── core/                    # Módulo core (singleton services)
│   │   │   ├── guards/              # Route guards (auth, role-based)
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   └── tenant.guard.ts
│   │   │   ├── interceptors/        # HTTP interceptors
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── tenant.interceptor.ts
│   │   │   ├── services/            # Servicios globales
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── websocket.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── models/              # Modelos e interfaces globales
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── tenant.model.ts
│   │   │   │   └── api-response.model.ts
│   │   │   ├── enums/               # Enumeraciones globales
│   │   │   │   ├── user-role.enum.ts
│   │   │   │   └── node-type.enum.ts
│   │   │   └── constants/           # Constantes de la aplicación
│   │   │       ├── api.constants.ts
│   │   │       └── app.constants.ts
│   │   │
│   │   ├── features/                # Módulos de negocio (lazy-loaded)
│   │   │   ├── auth/                # Autenticación
│   │   │   │   ├── components/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── login.component.ts
│   │   │   │   │   │   ├── login.component.html
│   │   │   │   │   │   └── login.component.scss
│   │   │   │   │   ├── register/
│   │   │   │   │   └── forgot-password/
│   │   │   │   ├── services/
│   │   │   │   │   └── auth-api.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── login-request.model.ts
│   │   │   │   │   └── register-request.model.ts
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── workflows/           # Gestión de workflows
│   │   │   │   ├── components/
│   │   │   │   │   ├── workflow-list/
│   │   │   │   │   ├── workflow-detail/
│   │   │   │   │   ├── workflow-canvas/
│   │   │   │   │   │   ├── workflow-canvas.component.ts
│   │   │   │   │   │   ├── workflow-canvas.component.html
│   │   │   │   │   │   └── workflow-canvas.component.scss
│   │   │   │   │   ├── node-config-panel/
│   │   │   │   │   └── swimlane-panel/
│   │   │   │   ├── services/
│   │   │   │   │   ├── workflow.service.ts
│   │   │   │   │   └── canvas.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── workflow.model.ts
│   │   │   │   │   └── swimlane.model.ts
│   │   │   │   └── workflows.routes.ts
│   │   │   │
│   │   │   ├── nodes/               # Gestión de nodos
│   │   │   │   ├── components/
│   │   │   │   │   ├── node-item/
│   │   │   │   │   ├── node-connector/
│   │   │   │   │   └── node-relation-selector/
│   │   │   │   ├── services/
│   │   │   │   │   └── node.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── node.model.ts
│   │   │   │   │   └── node-relation.model.ts
│   │   │   │   └── nodes.routes.ts
│   │   │   │
│   │   │   ├── executions/          # Ejecución de workflows
│   │   │   │   ├── components/
│   │   │   │   │   ├── execution-list/
│   │   │   │   │   ├── execution-detail/
│   │   │   │   │   └── execution-timeline/
│   │   │   │   ├── services/
│   │   │   │   │   └── execution.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── execution.model.ts
│   │   │   │   └── executions.routes.ts
│   │   │   │
│   │   │   ├── tasks/               # Tareas de funcionarios
│   │   │   │   ├── components/
│   │   │   │   │   ├── task-list/
│   │   │   │   │   ├── task-detail/
│   │   │   │   │   └── task-card/
│   │   │   │   ├── services/
│   │   │   │   │   └── task.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── task.model.ts
│   │   │   │   └── tasks.routes.ts
│   │   │   │
│   │   │   ├── forms/               # Formularios dinámicos
│   │   │   │   ├── components/
│   │   │   │   │   ├── form-builder/
│   │   │   │   │   ├── form-renderer/
│   │   │   │   │   ├── field-text/
│   │   │   │   │   ├── field-number/
│   │   │   │   │   ├── field-select/
│   │   │   │   │   └── field-date/
│   │   │   │   ├── services/
│   │   │   │   │   └── form.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── form-schema.model.ts
│   │   │   │   │   └── field-config.model.ts
│   │   │   │   └── forms.routes.ts
│   │   │   │
│   │   │   ├── departments/         # Departamentos/Áreas
│   │   │   │   ├── components/
│   │   │   │   │   ├── department-list/
│   │   │   │   │   └── department-form/
│   │   │   │   ├── services/
│   │   │   │   │   └── department.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── department.model.ts
│   │   │   │   └── departments.routes.ts
│   │   │   │
│   │   │   ├── notifications/       # Notificaciones en tiempo real
│   │   │   │   ├── components/
│   │   │   │   │   ├── notification-center/
│   │   │   │   │   └── notification-item/
│   │   │   │   ├── services/
│   │   │   │   │   └── notification-ws.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── notification.model.ts
│   │   │   │   └── notifications.routes.ts
│   │   │   │
│   │   │   ├── ai/                  # Funcionalidades de IA
│   │   │   │   ├── components/
│   │   │   │   │   ├── voice-command-button/
│   │   │   │   │   ├── voice-form-filler/
│   │   │   │   │   └── ai-status-indicator/
│   │   │   │   ├── services/
│   │   │   │   │   ├── ai.service.ts
│   │   │   │   │   └── speech-recognition.service.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── ai-command.model.ts
│   │   │   │   │   └── voice-transcript.model.ts
│   │   │   │   └── ai.routes.ts
│   │   │   │
│   │   │   └── dashboard/           # Dashboard principal
│   │   │       ├── components/
│   │   │       │   ├── dashboard-overview/
│   │   │       │   ├── stats-card/
│   │   │       │   └── recent-activity/
│   │   │       ├── services/
│   │   │       │   └── dashboard.service.ts
│   │   │       ├── models/
│   │   │       │   └── dashboard-stats.model.ts
│   │   │       └── dashboard.routes.ts
│   │   │
│   │   ├── shared/                  # Componentes reutilizables
│   │   │   ├── components/
│   │   │   │   ├── button/
│   │   │   │   ├── input/
│   │   │   │   ├── modal/
│   │   │   │   ├── table/
│   │   │   │   ├── spinner/
│   │   │   │   ├── card/
│   │   │   │   └── toast/
│   │   │   ├── directives/
│   │   │   │   ├── tooltip.directive.ts
│   │   │   │   ├── click-outside.directive.ts
│   │   │   │   └── auto-focus.directive.ts
│   │   │   ├── pipes/
│   │   │   │   ├── date-format.pipe.ts
│   │   │   │   ├── truncate.pipe.ts
│   │   │   │   └── safe-html.pipe.ts
│   │   │   ├── utils/
│   │   │   │   ├── date.utils.ts
│   │   │   │   ├── string.utils.ts
│   │   │   │   └── validation.utils.ts
│   │   │   └── validators/
│   │   │       ├── custom-validators.ts
│   │   │       └── form-validators.ts
│   │   │
│   │   ├── layouts/                 # Layouts de la aplicación
│   │   │   ├── main-layout/
│   │   │   │   ├── main-layout.component.ts
│   │   │   │   ├── main-layout.component.html
│   │   │   │   └── main-layout.component.scss
│   │   │   ├── admin-layout/
│   │   │   │   ├── admin-layout.component.ts
│   │   │   │   ├── admin-layout.component.html
│   │   │   │   ├── admin-layout.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   ├── sidebar/
│   │   │   │   │   ├── navbar/
│   │   │   │   │   └── footer/
│   │   │   └── public-layout/
│   │   │       ├── public-layout.component.ts
│   │   │       ├── public-layout.component.html
│   │   │       └── public-layout.component.scss
│   │   │
│   │   ├── app.config.ts            # Configuración principal de la app
│   │   ├── app.routes.ts            # Rutas principales
│   │   ├── app.ts                   # Componente raíz
│   │   ├── app.html                 # Template raíz
│   │   └── app.scss                 # Estilos globales
│   │
│   ├── assets/                      # Recursos estáticos
│   │   ├── images/
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── styles/
│   │       ├── _variables.scss      # Variables SCSS globales
│   │       ├── _mixins.scss         # Mixins reutilizables
│   │       ├── _animations.scss     # Animaciones CSS
│   │       └── _typography.scss     # Tipografía
│   │
│   ├── environments/                # Configuración por entorno
│   │   ├── environment.ts           # Desarrollo
│   │   └── environment.prod.ts      # Producción
│   │
│   ├── index.html                   # HTML principal
│   ├── main.ts                      # Punto de entrada
│   └── styles.scss                  # Estilos globales
│
├── .editorconfig                    # Configuración del editor
├── .gitignore
├── angular.json                     # Configuración de Angular CLI
├── package.json
├── tsconfig.json                    # Configuración de TypeScript
├── tailwind.config.js               # Configuración de TailwindCSS
└── README.md
```

---

## Convenciones y Buenas Prácticas

### Nomenclatura

#### Archivos y carpetas
- **Componentes**: `nombre-componente.component.ts` (kebab-case)
- **Servicios**: `nombre.service.ts`
- **Guards**: `nombre.guard.ts`
- **Interceptors**: `nombre.interceptor.ts`
- **Modelos**: `nombre.model.ts`
- **Enums**: `nombre.enum.ts`
- **Pipes**: `nombre.pipe.ts`
- **Directivas**: `nombre.directive.ts`

#### Clases y tipos
```typescript
// Componentes - PascalCase con sufijo Component
export class LoginComponent { }

// Servicios - PascalCase con sufijo Service
export class AuthService { }

// Interfaces - PascalCase con prefijo I (opcional)
export interface User { }
export interface IUser { }

// Enums - PascalCase
export enum UserRole {
  ADMIN = 'ADMIN',
  FUNCIONARIO = 'FUNCIONARIO',
  USUARIO = 'USUARIO'
}

// Types - PascalCase
export type ApiResponse<T> = { data: T; message: string; };
```

### Componentes Standalone

Todos los componentes deben ser **standalone**:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Usar signals para estado reactivo
  username = signal('');
  password = signal('');
  isLoading = signal(false);
}
```

### Signals para Estado Reactivo

Preferir **signals** sobre BehaviorSubject cuando sea posible:

```typescript
import { signal, computed } from '@angular/core';

export class WorkflowService {
  // Signal simple
  private workflows = signal<Workflow[]>([]);

  // Computed signal
  activeWorkflows = computed(() =>
    this.workflows().filter(w => w.status === 'ACTIVE')
  );

  // Exponer como readonly
  readonly workflows$ = this.workflows.asReadonly();
}
```

### Inyección de Dependencias con inject()

Usar la función `inject()` en lugar del constructor cuando sea posible:

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/httpClient';

export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>('/api/auth/login', credentials);
  }
}
```

### Tipado Fuerte

```typescript
// Definir interfaces para todas las respuestas de API
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Usar tipos genéricos
export class ApiService {
  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(endpoint);
  }
}
```

### Gestión de Subscripciones

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Auto-cleanup con takeUntilDestroyed
    this.service.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => console.log(data));
  }
}
```

---

## Módulos Principales

### Core Module

Contiene servicios singleton que deben instanciarse una sola vez:

- **AuthService**: Gestión de autenticación JWT
- **StorageService**: Manejo de localStorage/sessionStorage
- **WebSocketService**: Conexión WebSocket para tiempo real
- **NotificationService**: Sistema de notificaciones toast

### Features Modules

Cada feature es completamente independiente y lazy-loaded:

#### Auth Feature
- Login, registro, recuperación de contraseña
- Gestión de tokens (access + refresh)

#### Workflows Feature
- Canvas interactivo para diseño de workflows
- CRUD de workflows
- Configuración de nodos y relaciones
- Panel de swimlanes (carriles por departamento)

#### AI Feature
- Comandos de voz para el canvas
- Llenado automático de formularios por voz
- Indicador de estado de reconocimiento

### Shared Module

Componentes, directivas y pipes reutilizables:

- **Button, Input, Modal, Table**: Componentes UI básicos
- **Tooltip, ClickOutside**: Directivas útiles
- **DateFormat, Truncate**: Pipes de transformación

---

## Gestión de Estado

### Signals (Recomendado)

Para estado local de componentes y servicios:

```typescript
export class TaskListComponent {
  tasks = signal<Task[]>([]);
  selectedTask = signal<Task | null>(null);

  // Computed
  pendingTasks = computed(() =>
    this.tasks().filter(t => t.status === 'PENDING')
  );

  // Métodos que actualizan el state
  addTask(task: Task) {
    this.tasks.update(tasks => [...tasks, task]);
  }
}
```

### RxJS Observables

Para flujos de datos asíncronos complejos:

```typescript
export class ExecutionService {
  private executionSubject = new BehaviorSubject<Execution[]>([]);
  executions$ = this.executionSubject.asObservable();

  loadExecutions() {
    return this.http.get<Execution[]>('/api/executions')
      .pipe(
        tap(executions => this.executionSubject.next(executions)),
        catchError(this.handleError)
      );
  }
}
```

---

## Routing y Lazy Loading

### Estructura de Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component')
          .then(m => m.LoginComponent)
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: 'workflows',
        loadChildren: () => import('./features/workflows/workflows.routes')
          .then(m => m.WORKFLOWS_ROUTES)
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.routes')
          .then(m => m.DEPARTMENTS_ROUTES)
      }
    ]
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/components/dashboard-overview/dashboard-overview.component')
          .then(m => m.DashboardOverviewComponent)
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.routes')
          .then(m => m.TASKS_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
```

### Feature Routes

```typescript
// workflows.routes.ts
import { Routes } from '@angular/router';

export const WORKFLOWS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/workflow-list/workflow-list.component')
      .then(m => m.WorkflowListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/workflow-canvas/workflow-canvas.component')
      .then(m => m.WorkflowCanvasComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/workflow-detail/workflow-detail.component')
      .then(m => m.WorkflowDetailComponent)
  }
];
```

---

## Autenticación y Seguridad

### Auth Guard

```typescript
// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
```

### Auth Interceptor

```typescript
// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
```

### Configuración en app.config.ts

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, tenantInterceptor])
    )
  ]
};
```

---

## Integración con Backend

### API Service Pattern

```typescript
// features/workflows/services/workflow.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/workflows`;

  getAll(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(this.apiUrl);
  }

  getById(id: string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/${id}`);
  }

  create(workflow: CreateWorkflowRequest): Observable<Workflow> {
    return this.http.post<Workflow>(this.apiUrl, workflow);
  }

  update(id: string, workflow: UpdateWorkflowRequest): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.apiUrl}/${id}`, workflow);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'ws://localhost:8080/ws'
};

// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.organiflow.com/api',
  wsUrl: 'wss://api.organiflow.com/ws'
};
```

---

## Guía de Desarrollo

### Crear un Nuevo Feature

1. **Crear estructura de carpetas**:
```bash
cd src/app/features
mkdir -p mi-feature/{components,services,models}
```

2. **Crear componente principal**:
```bash
ng generate component features/mi-feature/components/mi-componente --standalone
```

3. **Crear servicio**:
```bash
ng generate service features/mi-feature/services/mi-feature
```

4. **Crear rutas**:
```typescript
// mi-feature.routes.ts
import { Routes } from '@angular/router';

export const MI_FEATURE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/mi-componente/mi-componente.component')
      .then(m => m.MiComponenteComponent)
  }
];
```

5. **Registrar en rutas principales**:
```typescript
// app.routes.ts
{
  path: 'mi-feature',
  loadChildren: () => import('./features/mi-feature/mi-feature.routes')
    .then(m => m.MI_FEATURE_ROUTES)
}
```

### Crear un Componente Compartido

```bash
ng generate component shared/components/mi-componente-compartido --standalone
```

Ejemplo de componente reutilizable:

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'btn ' + variant()"
      [disabled]="disabled()"
      (click)="handleClick()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn { @apply px-4 py-2 rounded font-medium transition; }
    .primary { @apply bg-blue-600 text-white hover:bg-blue-700; }
    .secondary { @apply bg-gray-600 text-white hover:bg-gray-700; }
  `]
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
  disabled = input(false);
  clicked = output<void>();

  handleClick() {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
```

### Integrar IA con Web Speech API

```typescript
// features/ai/services/speech-recognition.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  isListening = signal(false);
  transcript = signal('');

  private recognition: any;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.transcript.set(transcript);
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    }
  }

  startListening() {
    if (this.recognition) {
      this.recognition.start();
      this.isListening.set(true);
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening.set(false);
    }
  }
}
```

### WebSocket para Notificaciones

```typescript
// core/services/websocket.service.ts
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  connected = signal(false);

  connect(token: string) {
    this.socket = new WebSocket(`${environment.wsUrl}?token=${token}`);

    this.socket.onopen = () => {
      this.connected.set(true);
      console.log('WebSocket connected');
    };

    this.socket.onclose = () => {
      this.connected.set(false);
      console.log('WebSocket disconnected');
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private handleMessage(message: any) {
    // Procesar mensajes del WebSocket
    console.log('Message received:', message);
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email', () => {
    component.email.set('invalid-email');
    expect(component.isEmailValid()).toBe(false);

    component.email.set('valid@email.com');
    expect(component.isEmailValid()).toBe(true);
  });
});
```

### Ejecutar tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:coverage

# En modo watch
npm run test:watch
```

---

## Build y Deploy

### Desarrollo

```bash
npm run start
# O
ng serve
```

### Producción

```bash
# Build optimizado
npm run build

# Preview del build
npm run preview
```

### Variables de entorno

Configurar en `environment.prod.ts` antes del build:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.organiflow.com/api',
  wsUrl: 'wss://api.organiflow.com/ws'
};
```

---

## Resumen de Comandos

```bash
# Instalación
npm install

# Desarrollo
npm run start                    # Servidor dev en http://localhost:4200

# Testing
npm test                         # Run tests
npm run test:coverage            # Tests con coverage

# Build
npm run build                    # Build para producción
npm run build:dev                # Build para desarrollo

# Generación de código
ng g component features/mi-feature/components/mi-comp --standalone
ng g service features/mi-feature/services/mi-service
ng g guard core/guards/mi-guard
ng g interceptor core/interceptors/mi-interceptor
ng g pipe shared/pipes/mi-pipe --standalone
ng g directive shared/directives/mi-directive --standalone

# Linting y formato
npm run lint                     # ESLint
npm run format                   # Prettier
```

---

## Próximos Pasos

1. **Implementar autenticación completa** (login, registro, refresh token)
2. **Desarrollar canvas de workflows** con drag & drop
3. **Integrar Web Speech API** para comandos de voz
4. **Implementar WebSocket** para notificaciones en tiempo real
5. **Crear sistema de formularios dinámicos**
6. **Desarrollar componentes compartidos** del design system

---

## Referencias

- [Angular Documentation](https://angular.io/docs)
- [Angular Signals Guide](https://angular.io/guide/signals)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [RxJS Documentation](https://rxjs.dev)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

**Última actualización**: 2026-04-15
**Versión**: 1.0.0
