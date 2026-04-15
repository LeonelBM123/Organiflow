# Skill: Crear nueva feature Angular

Usa esta guía cada vez que debas crear un nuevo módulo de funcionalidad en el frontend.

## Estructura de carpetas del proyecto Angular

```
src/app/
├── core/
│   ├── auth/           ← guards, interceptors de auth
│   ├── models/         ← interfaces TypeScript globales
│   ├── services/       ← servicios HTTP globales
│   └── interceptors/   ← HTTP interceptors (auth, error)
├── shared/
│   ├── components/     ← componentes reutilizables (botones, modales, etc.)
│   └── pipes/          ← pipes globales
├── features/
│   └── [nombre-feature]/
│       ├── models/     ← interfaces específicas del feature
│       ├── services/   ← servicios del feature
│       ├── components/ ← componentes del feature
│       │   ├── [nombre]-list/
│       │   └── [nombre]-form/
│       └── pages/      ← páginas/vistas principales (routed components)
└── app.routes.ts       ← rutas con lazy loading
```

## Pasos para crear una nueva feature

### 1. Interfaz TypeScript (`features/[nombre]/models/`)
```typescript
export interface NombreEntidad {
  id: string;
  campo: string;
  // más campos...
  createdAt?: string;
  updatedAt?: string;
}

export interface NombreRequest {
  campo: string;
  // campos del form...
}
```

### 2. Servicio HTTP (`features/[nombre]/services/`)
```typescript
@Injectable({ providedIn: 'root' })
export class NombreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nombre-recurso`;

  getAll(): Observable<NombreEntidad[]> {
    return this.http.get<NombreEntidad[]>(this.baseUrl);
  }

  getById(id: string): Observable<NombreEntidad> {
    return this.http.get<NombreEntidad>(`${this.baseUrl}/${id}`);
  }

  create(request: NombreRequest): Observable<NombreEntidad> {
    return this.http.post<NombreEntidad>(this.baseUrl, request);
  }

  update(id: string, request: Partial<NombreRequest>): Observable<NombreEntidad> {
    return this.http.put<NombreEntidad>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```
- Siempre usar `inject()` en lugar de constructor injection
- `baseUrl` desde `environment.apiUrl`

### 3. Componente de lista (`components/[nombre]-list/`)
```typescript
@Component({
  selector: 'app-nombre-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './nombre-list.component.html'
})
export class NombreListComponent {
  private readonly nombreService = inject(NombreService);

  // Signals para estado
  items = signal<NombreEntidad[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.cargarItems();
  }

  cargarItems(): void {
    this.loading.set(true);
    this.nombreService.getAll().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los datos');
        this.loading.set(false);
      }
    });
  }
}
```

### 4. Componente de formulario (`components/[nombre]-form/`)
```typescript
@Component({
  selector: 'app-nombre-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './nombre-form.component.html'
})
export class NombreFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly nombreService = inject(NombreService);
  private readonly router = inject(Router);

  loading = signal(false);

  form = this.fb.group({
    campo: ['', [Validators.required, Validators.minLength(3)]],
    // más campos...
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.nombreService.create(this.form.value as NombreRequest).subscribe({
      next: () => this.router.navigate(['/nombre-recurso']),
      error: () => this.loading.set(false)
    });
  }
}
```

### 5. Página principal (`pages/`)
```typescript
@Component({
  selector: 'app-nombre-page',
  standalone: true,
  imports: [NombreListComponent],
  template: `<app-nombre-list />`
})
export class NombrePage {}
```

### 6. Agregar ruta lazy en `app.routes.ts`
```typescript
{
  path: 'nombre-recurso',
  loadComponent: () =>
    import('./features/nombre/pages/nombre.page')
      .then(m => m.NombrePage),
  canActivate: [authGuard]  // si requiere autenticación
}
```

---

## Convenciones Angular en Organiflow
- **Siempre** componentes standalone
- **Siempre** signals para estado local (`signal`, `computed`, `effect`)
- **Nunca** usar constructor injection, siempre `inject()`
- **Nombres**: componentes en PascalCase, archivos en kebab-case
- **Sufijos**: `.component.ts`, `.service.ts`, `.guard.ts`, `.pipe.ts`, `.page.ts` para páginas
- Lazy loading en **todas** las rutas de features

## Sistema de diseño (usar siempre estas clases/variables)

### Clases utilitarias propias (definidas en styles.scss)
- Botones: `btn-primary`, `btn-ghost`, `btn-danger`
- Contenedores: `card`, `panel`
- Inputs: `input`, `input-label`, `input-error`
- Fondo canvas: `canvas-bg`
- Micrófono activo IA: `mic-active`
- Badges de estado: `badge badge-pending|running|completed|rejected|waiting`
- Badges de rol: `badge badge-admin|funcionario|usuario`
- Badges de relación: `badge badge-sequential|conditional|iterative|union`

### Colores de relación entre nodos (usar SIEMPRE estas variables)
| Tipo | Variable CSS | Tailwind |
|------|-------------|---------|
| Secuencial | `var(--rel-sequential)` | `text-rel-sequential` |
| Condicional | `var(--rel-conditional)` | `text-rel-conditional` |
| Iterativo | `var(--rel-iterative)` | `text-rel-iterative` |
| Unión | `var(--rel-union)` | `text-rel-union` |

### Fuentes
- UI general: `font-sans` → DM Sans
- Código / IDs técnicos: `font-mono` → JetBrains Mono

### Superficies (profundidad visual)
`surface-0` (fondo) → `surface-1` → `surface-2` → `surface-3` → `surface-4` (más elevado)

## Checklist
- [ ] Interfaz TypeScript creada
- [ ] Servicio con todos los métodos HTTP necesarios
- [ ] Componentes standalone
- [ ] Estado manejado con signals
- [ ] Ruta agregada con lazy loading
- [ ] Guard aplicado si requiere autenticación