# Plan de Integración — Nuevos Endpoints de IA en el Frontend Angular

> **Contexto:** El microservicio `organiflow-ia` ahora expone 3 endpoints. El existente
> (`/mutations`) ya está integrado. Este documento planifica la integración de los 2 nuevos:
> - `POST /api/v1/ia/analyze` — detecta errores lógicos UML y cuellos de botella
> - `POST /api/v1/ia/generate-schema` — genera un `FormSchema` para un nodo TASK/ITERATOR

---

## Resumen ejecutivo

| # | Endpoint | Trigger en UI | Componente receptor | Tipo de cambio |
|---|----------|--------------|---------------------|----------------|
| 1 | `/analyze` | Botón "Analizar" en toolbar | `workflow-editor` + panel de resultados nuevo | Moderado |
| 2 | `/generate-schema` | Botón "Generar con IA" en node-panel | `node-panel.component` | Simple |

---

## Archivos a modificar

```
organiflow-frontend/src/app/features/workflows/
├── services/
│   └── ai.service.ts                        ← MODIFICAR: añadir 2 métodos + interfaces
├── models/
│   └── workflow.model.ts                    ← MODIFICAR: añadir tipos de análisis
├── components/workflow-editor/
│   ├── workflow-editor.component.ts         ← MODIFICAR: método analyzeWorkflow()
│   ├── workflow-editor.component.html       ← MODIFICAR: panel de resultados inline
│   ├── workflow-editor.component.scss       ← MODIFICAR: estilos del panel
│   ├── toolbar/
│   │   ├── editor-toolbar.component.ts      ← MODIFICAR: input/output botón analizar
│   │   └── editor-toolbar.component.html    ← MODIFICAR: añadir botón
│   └── node-panel/
│       ├── node-panel.component.ts          ← MODIFICAR: método + signal de carga
│       └── node-panel.component.html        ← MODIFICAR: botón "Generar con IA"
```

---

## Endpoint 1 — `/api/v1/ia/analyze`

### ¿Qué hace?
Recibe el estado actual del diagrama y devuelve:
- **`logic_errors`**: errores lógicos UML (nodos huérfanos, CONDITION mal conectado, etc.)
- **`bottlenecks`**: cuellos de botella (nodos saturados, carriles sobrecargados)
- **`summary`**: resumen en lenguaje natural
- **`is_valid`**: booleano

### Interfaces TypeScript a añadir en `workflow.model.ts`

```typescript
// --- Análisis de workflow ---

export type ErrorSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface WorkflowLogicError {
  severity: ErrorSeverity;
  node_id:  string | null;
  edge_id:  string | null;
  message:  string;
  suggestion: string;
}

export interface WorkflowBottleneck {
  node_id:   string;
  node_name: string | null;
  reason:    string;
  suggestion: string;
}

export interface WorkflowAnalysisResult {
  logic_errors: WorkflowLogicError[];
  bottlenecks:  WorkflowBottleneck[];
  summary:      string;
  is_valid:     boolean;
}

// Request (igual estructura que AiEditRequest pero sin prompt)
export interface WorkflowAnalysisRequest {
  nodes: AiNodeSummary[];
  edges: AiEdgeSummary[];
  lanes: AiLaneSummary[];
}
```

### Cambios en `ai.service.ts`

```typescript
// Añadir constante de base URL
private readonly baseUrl = 'http://localhost:8005/api/v1/ia';

// Nuevo método
analyze(request: WorkflowAnalysisRequest): Observable<WorkflowAnalysisResult> {
  return this.http.post<WorkflowAnalysisResult>(
    `${this.baseUrl}/analyze`,
    request
  );
}
```

> **Nota:** Extraer la base URL a una constante privada para reutilizar en los 3 métodos
> y facilitar el cambio a `environment.iaApiUrl` en el futuro.

### UX — ¿Dónde y cómo se muestra?

**Trigger:** Botón "Analizar workflow" en `editor-toolbar.component`.
Ícono sugerido: escudo o lupa (`shield-check` / `search`). Solo visible cuando el
diagrama tiene al menos 2 nodos.

**Panel de resultados:** Un panel deslizante desde la derecha (drawer), separado del
`node-panel`, que aparece sobre el canvas con posición `fixed` o dentro del layout
del editor. Debe mostrar:

```
┌─────────────────────────────────────────┐
│  Análisis del Workflow           [✕]    │
├─────────────────────────────────────────┤
│  ℹ️  "El workflow tiene 8 nodos y 7     │
│      conectores. Se detectaron..."      │
├─────────────────────────────────────────┤
│  ❌ ERRORES (2)                          │
│  ┌───────────────────────────────────┐  │
│  │ ⬤ Nodo huérfano: "Revisión"       │  │  ← click → highlight nodo en canvas
│  │   💡 Conecta este nodo al flujo   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ⬤ CONDITION sin 2 salidas         │  │
│  │   💡 Añade una rama alternativa   │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  ⚠️  ADVERTENCIAS (1)                   │
│  ...                                    │
├─────────────────────────────────────────┤
│  🔴 CUELLOS DE BOTELLA (1)              │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Cambios en `workflow-editor.component.ts`

**Signals nuevos:**
```typescript
readonly isAnalyzing = signal(false);
readonly analysisResult = signal<WorkflowAnalysisResult | null>(null);
readonly showAnalysisPanel = signal(false);
```

**Método nuevo:**
```typescript
analyzeWorkflow(): void {
  if (this.isAnalyzing()) return;

  const nodes = this._extractNodesForAi();   // método ya existente en pedirCambiosIA()
  const edges = this._extractEdgesForAi();   // extraer a método privado reutilizable
  const lanes = this._extractLanesForAi();   // ídem

  this.isAnalyzing.set(true);
  this.aiService.analyze({ nodes, edges, lanes }).subscribe({
    next: (result) => {
      this.analysisResult.set(result);
      this.showAnalysisPanel.set(true);
      this.isAnalyzing.set(false);
    },
    error: () => this.isAnalyzing.set(false),
  });
}
```

> **Refactor oportunista:** El código de extracción de nodos/edges/lanes dentro de
> `pedirCambiosIA()` (líneas ~1150–1170) se debe extraer a 3 métodos privados
> `_extractNodesForAi()`, `_extractEdgesForAi()` y `_extractLanesForAi()`.
> Esto elimina duplicación y es el único refactor necesario en el editor.

**Interacción click → highlight en canvas:**
```typescript
highlightNode(nodeId: string | null): void {
  if (!nodeId) return;
  const node = this.diagram.getObject(nodeId);
  if (node) {
    this.diagram.select([node]);
    this.diagram.bringIntoView(node.wrapper.bounds);
  }
}
```

### Cambios en `editor-toolbar.component`

**Output nuevo:**
```typescript
readonly analyzeClicked = output<void>();
readonly isAnalyzing = input<boolean>(false);
```

**HTML (añadir al grupo de acciones de IA):**
```html
<button
  [disabled]="isAnalyzing()"
  (click)="analyzeClicked.emit()"
  title="Analizar workflow"
  aria-label="Analizar errores lógicos del workflow">
  @if (isAnalyzing()) {
    <span class="spinner" aria-hidden="true"></span>
  } @else {
    <svg><!-- ícono escudo --></svg>
  }
  Analizar
</button>
```

### Cambios en `workflow-editor.component.html`

Añadir el panel de resultados como un `<aside>` condicional junto al canvas:

```html
@if (showAnalysisPanel()) {
  <aside class="analysis-panel" role="complementary" aria-label="Resultados del análisis">
    <!-- header + botón cerrar -->
    <!-- summary -->
    <!-- sección de errores -->
    <!-- sección de advertencias -->
    <!-- sección de cuellos de botella -->
  </aside>
}
```

---

## Endpoint 2 — `/api/v1/ia/generate-schema`

### ¿Qué hace?
Dado el tipo de nodo, contexto del proceso y departamento, devuelve un `FormSchema`
con campos relevantes pre-generados por el LLM.

### Interfaces TypeScript a añadir en `workflow.model.ts`

```typescript
// --- Generación de esquema ---

export interface NodeSchemaRequest {
  node_type:       NodeType;
  context:         string;   // nombre del nodo + descripción del proceso
  department_name?: string;  // para contextualizar los campos
  language:        string;   // 'es' por defecto
}

export interface NodeSchemaResponse {
  form_schema: FormSchema;
  reasoning:   string;
}
```

### Cambios en `ai.service.ts`

```typescript
generateSchema(request: NodeSchemaRequest): Observable<NodeSchemaResponse> {
  return this.http.post<NodeSchemaResponse>(
    `${this.baseUrl}/generate-schema`,
    request
  );
}
```

### UX — ¿Dónde y cómo se muestra?

**Trigger:** Botón "✨ Generar con IA" dentro del `node-panel`, en la sección
de formulario dinámico, solo visible para nodos `TASK` e `ITERATOR`.

```
┌─────────────────────────────────────────┐
│  Formulario del nodo                    │
│                                         │
│  Nombre del formulario                  │
│  [_____________________________]        │
│                                         │
│  Campos del formulario          [+]     │
│  ┌─────────────────────────────────┐   │
│  │ Campo 1: nombre / tipo / req    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [✨ Generar campos con IA]  ←── nuevo  │
│   "Genera campos sugeridos basados      │
│    en el nombre del nodo y departamento"│
└─────────────────────────────────────────┘
```

Al hacer click:
1. Muestra un spinner en el botón (`isGeneratingSchema = signal(false)`)
2. Llama al endpoint con `node_type`, `context` (nombre del nodo), `department_name`
3. Al recibir la respuesta:
   - Si el FormArray ya tiene campos: muestra un diálogo de confirmación
     ("¿Reemplazar los campos actuales o añadir al final?")
   - Si está vacío: rellena directamente
4. Desaparece el spinner

### Cambios en `node-panel.component.ts`

**Inyección de `AiService`:**
```typescript
private readonly aiService = inject(AiService);
```

**Signals nuevos:**
```typescript
readonly isGeneratingSchema = signal(false);
```

**Método nuevo:**
```typescript
generateSchema(): void {
  const node = this.node();
  if (!node || this.isGeneratingSchema()) return;

  const dept = this.departments()
    .find(d => d.id === this.form.get('departmentId')?.value);

  this.isGeneratingSchema.set(true);
  this.aiService.generateSchema({
    node_type:       node.type,
    context:         this.form.get('name')?.value || node.name,
    department_name: dept?.name,
    language:        'es',
  }).subscribe({
    next: (res) => {
      this._applyGeneratedSchema(res.form_schema);
      this.isGeneratingSchema.set(false);
    },
    error: () => this.isGeneratingSchema.set(false),
  });
}

private _applyGeneratedSchema(schema: FormSchema): void {
  const fieldsArray = this.form.get('fields') as FormArray;

  // Si ya hay campos, preguntar; si no, rellenar directo
  if (fieldsArray.length > 0) {
    // TODO: mostrar confirmación simple (puede ser window.confirm o signal de modal)
    if (!confirm('¿Reemplazar los campos actuales con los generados por IA?')) return;
    fieldsArray.clear();
  }

  // Actualizar nombre del formulario si estaba vacío
  if (!this.form.get('formSchemaName')?.value) {
    this.form.patchValue({ formSchemaName: schema.name });
  }

  // Añadir los campos generados al FormArray
  schema.fields.forEach(field => {
    fieldsArray.push(this.buildFieldGroup({
      ...field,
      options: field.options?.join(', ') ?? '',   // el panel espera string CSV
    }));
  });
}
```

> **Nota sobre `confirm()`:** Es un punto de partida funcional. En una iteración
> posterior puede reemplazarse por una señal `showReplaceConfirm = signal(false)`
> con un pequeño inline confirmation en el HTML.

### Cambios en `node-panel.component.html`

Añadir dentro de la sección `@if (isTask)`, después de la lista de campos:

```html
<button
  type="button"
  class="btn-generate-schema"
  [disabled]="isGeneratingSchema()"
  (click)="generateSchema()"
  aria-label="Generar campos del formulario con inteligencia artificial">
  @if (isGeneratingSchema()) {
    <span class="spinner-xs" aria-hidden="true"></span>
    Generando...
  } @else {
    <svg><!-- ícono estrella/chispa --></svg>
    Generar con IA
  }
</button>
<p class="btn-generate-schema__hint">
  Sugiere campos basados en el nombre del nodo y el departamento asignado.
</p>
```

---

## Orden de implementación recomendado

```
Paso 1 — workflow.model.ts
  └── Añadir: WorkflowLogicError, WorkflowBottleneck, WorkflowAnalysisResult,
              WorkflowAnalysisRequest, NodeSchemaRequest, NodeSchemaResponse

Paso 2 — ai.service.ts
  └── Refactorizar URL base a constante
  └── Añadir método analyze()
  └── Añadir método generateSchema()

Paso 3 — workflow-editor.component.ts
  └── Extraer _extractNodesForAi(), _extractEdgesForAi(), _extractLanesForAi()
  └── Refactorizar pedirCambiosIA() para usar los 3 métodos privados
  └── Añadir signals: isAnalyzing, analysisResult, showAnalysisPanel
  └── Añadir método analyzeWorkflow()
  └── Añadir método highlightNode()

Paso 4 — editor-toolbar.component
  └── Añadir input isAnalyzing
  └── Añadir output analyzeClicked
  └── Añadir botón en HTML

Paso 5 — workflow-editor.component.html + .scss
  └── Bindear (analyzeClicked) del toolbar → analyzeWorkflow()
  └── Añadir <aside class="analysis-panel"> con toda la estructura
  └── Añadir estilos del panel

Paso 6 — node-panel.component.ts
  └── Inyectar AiService
  └── Añadir signal isGeneratingSchema
  └── Añadir métodos generateSchema() y _applyGeneratedSchema()

Paso 7 — node-panel.component.html + .scss
  └── Añadir botón "Generar con IA" con su hint
  └── Añadir estilos del botón
```

---

## Consideraciones técnicas

### CORS y URL del microservicio
El `ai.service.ts` actual tiene la URL hardcodeada como `http://localhost:8005/...`.
En la refactorización, moverla a `environment.iaApiUrl` para soportar producción.

```typescript
// environment.ts
export const environment = {
  apiUrl:   'http://localhost:8080',
  iaApiUrl: 'http://localhost:8005',   // ← añadir
};
```

### Manejo de errores
Añadir un `signal<string | null>` para mensajes de error en el editor y el node-panel,
visible como un toast o banner en la UI, para no silenciar fallos de IA.

### Accesibilidad (WCAG AA)
- El panel de análisis debe tener `role="complementary"` y `aria-label`.
- Los indicadores de severidad (ERROR/WARNING) no deben depender solo del color;
  añadir ícono + texto (`role="img" aria-label="Error crítico"`).
- El botón "Generar con IA" debe tener estado `aria-busy="true"` durante la carga.
- Al abrir el panel de análisis, mover el foco al primer elemento interactivo con `focus()`.

### OnPush change detection
Tanto `workflow-editor` como `node-panel` usan `ChangeDetectionStrategy.OnPush`.
Todo el estado nuevo debe gestionarse con `signal()` / `computed()` para que la
detección de cambios funcione correctamente sin necesitar `cdr.detectChanges()`.

---

## Criterios de verificación (Definition of Done)

### Endpoint `/analyze`
- [ ] El botón "Analizar" aparece en la toolbar del editor
- [ ] Al hacer click, muestra un spinner y el botón queda deshabilitado
- [ ] El panel de resultados se abre al recibir la respuesta
- [ ] Los errores se listan con su severidad e ícono correspondiente
- [ ] Hacer click en un error selecciona y centra el nodo en el canvas
- [ ] El panel se puede cerrar con el botón ✕
- [ ] Si el workflow no tiene errores, se muestra el mensaje positivo del `summary`
- [ ] Si la llamada falla, se muestra un mensaje de error en la UI (no solo consola)

### Endpoint `/generate-schema`
- [ ] El botón "Generar con IA" solo es visible para nodos TASK e ITERATOR
- [ ] Muestra "Generando..." y se deshabilita durante la llamada
- [ ] Si el FormArray tiene campos, pide confirmación antes de reemplazar
- [ ] Los campos generados se rellenan correctamente en el formulario
- [ ] El nombre del formulario se rellena si estaba vacío
- [ ] Si la llamada falla, el botón vuelve a su estado normal y muestra error
- [ ] Tras generar, el usuario puede editar/eliminar cualquier campo generado

---

## Estimación de complejidad

| Tarea | Archivos | Complejidad |
|-------|----------|-------------|
| Types en workflow.model.ts | 1 | Baja |
| ai.service.ts refactor + 2 métodos | 1 | Baja |
| Refactor extract en workflow-editor | 1 | Baja |
| analyzeWorkflow() + signals | 1 | Media |
| Panel de análisis HTML + SCSS | 2 | Media |
| Toolbar botón analizar | 2 | Baja |
| node-panel generateSchema() | 1 | Baja |
| node-panel HTML + SCSS | 2 | Baja |
| **Total** | **~10 archivos** | **Media** |

---

## ⚠️ Problema crítico: snake_case vs camelCase

### El problema

FastAPI serializa los modelos Pydantic usando los **nombres de campo** (snake_case) por
defecto, no los aliases (camelCase). Los modelos Python que se crean como respuesta usan
snake_case en sus field names:

| Modelo Python | Campo Python | JSON que envía FastAPI | Lo que espera Angular |
|---|---|---|---|
| `WorkflowAnalysisResponse` | `logic_errors` | `"logic_errors"` | `logicErrors` |
| `WorkflowAnalysisResponse` | `is_valid` | `"is_valid"` | `isValid` |
| `LogicError` | `node_id` | `"node_id"` | `nodeId` |
| `LogicError` | `edge_id` | `"edge_id"` | `edgeId` |
| `NodeSchemaResponse` | `form_schema` | `"form_schema"` | `formSchema` |
| `FormField` | `sort_order` | `"sort_order"` | `sortOrder` |
| `FormField` | `validation_rules` | `"validation_rules"` | `validationRules` |
| `FormField` | `visibility_conditions` | `"visibility_conditions"` | `visibilityConditions` |

Si no se corrige esto, `_applyGeneratedSchema()` recibirá `field.sort_order` como
`undefined` al intentar acceder a `field.sortOrder`.

### Fix en Python — 2 pasos

**Paso A:** Añadir `alias_generator` a los modelos de respuesta de los 2 nuevos endpoints
en `models.py`:

```python
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

# Aplicar a: LogicError, Bottleneck, WorkflowAnalysisRequest,
#            WorkflowAnalysisResponse, NodeSchemaRequest, NodeSchemaResponse
# (NO aplicar a EditRequest ni MutationPlan — ya funcionan con el frontend)

class LogicError(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,   # acepta tanto node_id como nodeId como input
    )
    severity: ErrorSeverity
    node_id:  Optional[str] = None   # → alias automático: nodeId
    edge_id:  Optional[str] = None   # → alias automático: edgeId
    message:  str
    suggestion: str


class Bottleneck(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    node_id:   str             # → nodeId
    node_name: Optional[str] = None  # → nodeName
    reason:    str
    suggestion: str


class WorkflowAnalysisResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    logic_errors: List[LogicError] = []    # → logicErrors
    bottlenecks:  List[Bottleneck] = []
    summary:      str
    is_valid:     bool                     # → isValid


class NodeSchemaResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    form_schema: FormSchema    # → formSchema
    reasoning:   str
```

Para `FormField`, ya tiene aliases manuales (`sortOrder`, `validationRules`,
`visibilityConditions`). Reemplazarlos por el `alias_generator` automático da
el mismo resultado y es más limpio:

```python
class FormField(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    name:                 str
    label:                str
    type:                 FieldType = "text"
    required:             bool = False
    options:              List[str] = []
    sort_order:           int = Field(default=1, ge=1)   # → sortOrder
    validation_rules:     dict[str, Any] = {}            # → validationRules
    visibility_conditions: dict[str, Any] = {}           # → visibilityConditions
```

**Paso B:** En los routers que usan estos modelos, activar serialización por alias:

```python
# routers/analysis.py
@router.post(
    "/analyze",
    response_model=WorkflowAnalysisResponse,
    response_model_by_alias=True,   # ← outputs camelCase
    ...
)

# routers/schema.py
@router.post(
    "/generate-schema",
    response_model=NodeSchemaResponse,
    response_model_by_alias=True,   # ← outputs camelCase
    ...
)
```

> `WorkflowAnalysisRequest` y `NodeSchemaRequest` son modelos de **entrada**,
> no necesitan `alias_generator` a menos que el frontend los envíe en camelCase.
> Como Angular los enviará en snake_case (igual que el endpoint `/mutations`),
> se pueden dejar como están.

Con estos 2 pasos, FastAPI enviará JSON camelCase y los tipos TypeScript del plan
funcionarán sin adaptadores adicionales.

---

## Código completo — `ai.service.ts` refactorizado

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WorkflowAnalysisRequest,
  WorkflowAnalysisResult,
  NodeSchemaRequest,
  NodeSchemaResponse,
} from '../models/workflow.model';

// ---- Tipos internos del servicio (request al microservicio IA) ----

export interface AiNodeSummary {
  id:     string;
  name:   string;
  type:   string;
  laneId: string | undefined;
}

export interface AiEdgeSummary {
  id:       string;
  sourceId: string;
  targetId: string;
}

export interface AiLaneSummary {
  id:   string;
  name: string;
}

export interface AiEditRequest {
  prompt:        string;
  current_nodes: AiNodeSummary[];
  current_edges: AiEdgeSummary[];
  current_lanes: AiLaneSummary[];
}

export interface AiMutation {
  action:    'ADD_NODE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_EDGE' | 'DELETE_EDGE' | 'ADD_LANE' | 'UPDATE_LANE' | 'DELETE_LANE';
  target_id?: string;
  node_data?: { id: string; name: string; type?: string; laneId?: string };
  edge_data?: { id?: string; sourceId: string; targetId: string; relationType?: string };
  lane_data?: { id?: string; name: string };
}

export interface AiMutationPlan {
  razonamiento: string;
  mutations:    AiMutation[];
}

// ---- Servicio ----

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.iaApiUrl}/api/v1/ia`;

  /** Genera mutaciones de workflow a partir de un prompt en lenguaje natural. */
  getMutations(request: AiEditRequest): Observable<AiMutationPlan> {
    return this.http.post<AiMutationPlan>(`${this.baseUrl}/mutations`, request);
  }

  /** Analiza el workflow en busca de errores lógicos UML y cuellos de botella. */
  analyze(request: WorkflowAnalysisRequest): Observable<WorkflowAnalysisResult> {
    return this.http.post<WorkflowAnalysisResult>(`${this.baseUrl}/analyze`, request);
  }

  /** Genera un FormSchema para un nodo dado su tipo y contexto de proceso. */
  generateSchema(request: NodeSchemaRequest): Observable<NodeSchemaResponse> {
    return this.http.post<NodeSchemaResponse>(`${this.baseUrl}/generate-schema`, request);
  }
}
```

---

## Código completo — tipos nuevos en `workflow.model.ts`

Añadir al final del archivo existente:

```typescript
// ============================================================
// Análisis de workflow (endpoint /analyze)
// ============================================================

export type ErrorSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface WorkflowLogicError {
  severity:   ErrorSeverity;
  nodeId:     string | null;
  edgeId:     string | null;
  message:    string;
  suggestion: string;
}

export interface WorkflowBottleneck {
  nodeId:     string;
  nodeName:   string | null;
  reason:     string;
  suggestion: string;
}

export interface WorkflowAnalysisResult {
  logicErrors:  WorkflowLogicError[];
  bottlenecks:  WorkflowBottleneck[];
  summary:      string;
  isValid:      boolean;
}

/** Payload enviado al endpoint /analyze */
export interface WorkflowAnalysisRequest {
  nodes: { id: string; name: string; type: string; laneId?: string }[];
  edges: { id: string; sourceId: string; targetId: string }[];
  lanes: { id: string; name: string }[];
}

// ============================================================
// Generación de esquema de nodo (endpoint /generate-schema)
// ============================================================

/** Payload enviado al endpoint /generate-schema */
export interface NodeSchemaRequest {
  node_type:        NodeType;
  context:          string;
  department_name?: string;
  language:         string;
}

export interface NodeSchemaResponse {
  formSchema: FormSchema;   // camelCase tras el fix de Python
  reasoning:  string;
}
```

---

## Código completo — `environment.ts` actualizado

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl:     'http://localhost:8001',   // Spring Boot
  iaApiUrl:   'http://localhost:8005',   // Microservicio Python IA  ← AÑADIR
};
```

> Si existe `environment.production.ts`, añadir también `iaApiUrl` con la URL
> de producción del microservicio.

---

## Código completo — Refactor de extracción en `workflow-editor.component.ts`

El método `pedirCambiosIA()` actual (líneas ~1150-1180) construye inline los arrays
de nodos, edges y lanes. Extraer a 3 métodos privados que ambos métodos comparten:

```typescript
// ---- Métodos privados de extracción (añadir cerca de pedirCambiosIA) ----

private _extractNodesForAi(): { id: string; name: string; type: string; laneId?: string }[] {
  return (this.diagram.nodes as any[])
    .filter(n => n.addInfo?.organiflowType)
    .map(n => ({
      id:     n.id,
      name:   n.addInfo?.name ?? n.annotations?.[0]?.content ?? 'Sin nombre',
      type:   n.addInfo?.organiflowType ?? 'TASK',
      laneId: n.addInfo?.laneId ?? n.addInfo?.departmentId,
    }));
}

private _extractEdgesForAi(): { id: string; sourceId: string; targetId: string }[] {
  return (this.diagram.connectors as any[]).map(c => ({
    id:       c.id,
    sourceId: c.sourceID,
    targetId: c.targetID,
  }));
}

private _extractLanesForAi(): { id: string; name: string }[] {
  const swimlaneNode = (this.diagram.nodes as any[])
    .find(n => n.shape?.type === 'SwimLane');
  return ((swimlaneNode?.shape?.lanes ?? []) as any[]).map((lane: any) => {
    const laneId = String(lane.id ?? '').replace('lane_', '');
    return { id: laneId, name: lane.header?.annotation?.content ?? laneId };
  });
}
```

Luego reemplazar el código inline de `pedirCambiosIA()` y añadir `analyzeWorkflow()`:

```typescript
pedirCambiosIA(): void {
  const prompt = this.iaPrompt().trim();
  if (!prompt || this.isAiThinking()) return;

  this.isAiThinking.set(true);
  this.aiService.getMutations({
    prompt,
    current_nodes: this._extractNodesForAi(),
    current_edges: this._extractEdgesForAi(),
    current_lanes: this._extractLanesForAi(),
  }).subscribe({
    next: (plan) => {
      this.ejecutarMutacionesSyncfusion(plan.mutations);
      this.iaPrompt.set('');
      this.isAiThinking.set(false);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('[IA] Error:', err);
      this.isAiThinking.set(false);
      this.cdr.detectChanges();
    },
  });
}

analyzeWorkflow(): void {
  if (this.isAnalyzing()) return;

  this.isAnalyzing.set(true);
  this.analysisError.set(null);

  this.aiService.analyze({
    nodes: this._extractNodesForAi(),
    edges: this._extractEdgesForAi(),
    lanes: this._extractLanesForAi(),
  }).subscribe({
    next: (result) => {
      this.analysisResult.set(result);
      this.showAnalysisPanel.set(true);
      this.isAnalyzing.set(false);
    },
    error: () => {
      this.analysisError.set('No se pudo conectar con el servicio de análisis. Verifica que el microservicio de IA esté activo.');
      this.isAnalyzing.set(false);
    },
  });
}

highlightNode(nodeId: string | null): void {
  if (!nodeId) return;
  const node = this.diagram.getObject(nodeId);
  if (node) {
    this.diagram.select([node as any]);
    this.diagram.bringIntoView((node as any).wrapper?.bounds);
  }
}

closeAnalysisPanel(): void {
  this.showAnalysisPanel.set(false);
  this.analysisResult.set(null);
}
```

**Signals nuevos a declarar en la clase:**

```typescript
// Análisis de workflow
readonly isAnalyzing      = signal(false);
readonly analysisResult   = signal<WorkflowAnalysisResult | null>(null);
readonly showAnalysisPanel = signal(false);
readonly analysisError    = signal<string | null>(null);

// Computed helpers para el template
readonly analysisErrors   = computed(() =>
  this.analysisResult()?.logicErrors.filter(e => e.severity === 'ERROR') ?? []
);
readonly analysisWarnings = computed(() =>
  this.analysisResult()?.logicErrors.filter(e => e.severity === 'WARNING') ?? []
);
```

---

## HTML completo — Panel de análisis en `workflow-editor.component.html`

Añadir dentro del contenedor principal del editor, como hermano del `<aside>` del
`node-panel` existente:

```html
@if (showAnalysisPanel()) {
  <aside
    class="analysis-panel"
    role="complementary"
    aria-label="Resultados del análisis del workflow"
    aria-live="polite">

    <!-- Cabecera -->
    <div class="analysis-panel__header">
      <h2 class="analysis-panel__title">Análisis del Workflow</h2>
      <button
        type="button"
        class="analysis-panel__close"
        (click)="closeAnalysisPanel()"
        aria-label="Cerrar panel de análisis">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Resumen general -->
    <div
      class="analysis-panel__summary"
      [class.analysis-panel__summary--valid]="analysisResult()!.isValid"
      [class.analysis-panel__summary--invalid]="!analysisResult()!.isValid">
      <p>{{ analysisResult()!.summary }}</p>
    </div>

    <!-- Errores críticos -->
    @if (analysisErrors().length > 0) {
      <section class="analysis-panel__section" aria-labelledby="errors-heading">
        <h3 id="errors-heading" class="analysis-panel__section-title analysis-panel__section-title--error">
          <span role="img" aria-label="Error crítico">❌</span>
          Errores críticos ({{ analysisErrors().length }})
        </h3>
        <ul class="analysis-panel__list">
          @for (error of analysisErrors(); track error.message) {
            <li
              class="analysis-panel__item analysis-panel__item--error"
              [class.analysis-panel__item--clickable]="!!error.nodeId"
              (click)="highlightNode(error.nodeId)"
              [attr.role]="error.nodeId ? 'button' : null"
              [attr.tabindex]="error.nodeId ? 0 : null"
              [attr.aria-label]="error.nodeId ? 'Ir al nodo con error: ' + error.message : null"
              (keydown.enter)="highlightNode(error.nodeId)">
              <p class="analysis-panel__item-message">{{ error.message }}</p>
              <p class="analysis-panel__item-suggestion">
                <span aria-hidden="true">💡</span> {{ error.suggestion }}
              </p>
            </li>
          }
        </ul>
      </section>
    }

    <!-- Advertencias -->
    @if (analysisWarnings().length > 0) {
      <section class="analysis-panel__section" aria-labelledby="warnings-heading">
        <h3 id="warnings-heading" class="analysis-panel__section-title analysis-panel__section-title--warning">
          <span role="img" aria-label="Advertencia">⚠️</span>
          Advertencias ({{ analysisWarnings().length }})
        </h3>
        <ul class="analysis-panel__list">
          @for (warn of analysisWarnings(); track warn.message) {
            <li
              class="analysis-panel__item analysis-panel__item--warning"
              [class.analysis-panel__item--clickable]="!!warn.nodeId"
              (click)="highlightNode(warn.nodeId)"
              [attr.role]="warn.nodeId ? 'button' : null"
              [attr.tabindex]="warn.nodeId ? 0 : null">
              <p class="analysis-panel__item-message">{{ warn.message }}</p>
              <p class="analysis-panel__item-suggestion">
                <span aria-hidden="true">💡</span> {{ warn.suggestion }}
              </p>
            </li>
          }
        </ul>
      </section>
    }

    <!-- Cuellos de botella -->
    @if (analysisResult()!.bottlenecks.length > 0) {
      <section class="analysis-panel__section" aria-labelledby="bottlenecks-heading">
        <h3 id="bottlenecks-heading" class="analysis-panel__section-title analysis-panel__section-title--bottleneck">
          <span role="img" aria-label="Cuello de botella">🔴</span>
          Cuellos de botella ({{ analysisResult()!.bottlenecks.length }})
        </h3>
        <ul class="analysis-panel__list">
          @for (bn of analysisResult()!.bottlenecks; track bn.nodeId) {
            <li
              class="analysis-panel__item analysis-panel__item--bottleneck"
              [class.analysis-panel__item--clickable]="true"
              (click)="highlightNode(bn.nodeId)"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Ir al nodo: ' + (bn.nodeName ?? bn.nodeId)"
              (keydown.enter)="highlightNode(bn.nodeId)">
              @if (bn.nodeName) {
                <span class="analysis-panel__item-node-name">{{ bn.nodeName }}</span>
              }
              <p class="analysis-panel__item-message">{{ bn.reason }}</p>
              <p class="analysis-panel__item-suggestion">
                <span aria-hidden="true">💡</span> {{ bn.suggestion }}
              </p>
            </li>
          }
        </ul>
      </section>
    }

    <!-- Estado vacío: sin problemas -->
    @if (analysisErrors().length === 0 && analysisWarnings().length === 0 && analysisResult()!.bottlenecks.length === 0) {
      <div class="analysis-panel__empty">
        <span aria-hidden="true">✅</span>
        <p>El workflow no tiene errores ni advertencias.</p>
      </div>
    }

  </aside>
}

<!-- Toast de error de conexión -->
@if (analysisError()) {
  <div class="analysis-error-toast" role="alert" aria-live="assertive">
    {{ analysisError() }}
    <button (click)="analysisError.set(null)" aria-label="Cerrar notificación">✕</button>
  </div>
}
```

---

## SCSS — Panel de análisis (`workflow-editor.component.scss`)

```scss
// ---- Panel de análisis de workflow ----

.analysis-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: var(--surface-1);
  border-left: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 20;
  animation: slideInRight 0.2s ease-out;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: var(--surface-3); }
    &:focus-visible { outline: 2px solid var(--primary-500); outline-offset: 2px; }
  }

  &__summary {
    padding: 12px 20px;
    font-size: 13px;
    line-height: 1.5;
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;

    p { margin: 0; color: var(--text-secondary); }

    &--valid   { background: color-mix(in srgb, #22c55e 8%, transparent); }
    &--invalid { background: color-mix(in srgb, #ef4444 8%, transparent); }
  }

  // scroll en el cuerpo
  > section,
  > .analysis-panel__empty {
    overflow-y: auto;
    flex: 1;
  }

  &__section {
    padding: 16px 20px 0;
    flex: unset;
    overflow: visible;

    & + & { margin-top: 4px; }
  }

  &__section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 6px;

    &--error      { color: #ef4444; }
    &--warning    { color: #f59e0b; }
    &--bottleneck { color: #8b5cf6; }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    background: var(--surface-2);
    border-radius: 8px;
    padding: 10px 12px;
    border: 1px solid var(--border-default);

    &--error      { border-left: 3px solid #ef4444; }
    &--warning    { border-left: 3px solid #f59e0b; }
    &--bottleneck { border-left: 3px solid #8b5cf6; }

    &--clickable {
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;

      &:hover { background: var(--surface-3); }
      &:focus-visible { outline: 2px solid var(--primary-500); outline-offset: 2px; border-radius: 8px; }
    }
  }

  &__item-node-name {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }

  &__item-message {
    font-size: 13px;
    color: var(--text-primary);
    margin: 0 0 4px;
    line-height: 1.4;
  }

  &__item-suggestion {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    font-size: 14px;
    color: var(--text-secondary);
    text-align: center;

    span { font-size: 32px; }
    p { margin: 0; }
  }
}

// ---- Toast de error de conexión ----

.analysis-error-toast {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e1e2e;
  color: #f8f8f2;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);

  button {
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
  }
}

// ---- Animación de entrada ----

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

---

## SCSS — Botón "Generar con IA" en `node-panel.component.scss`

```scss
// ---- Botón generar formulario con IA ----

.btn-generate-schema {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px dashed var(--primary-500);
  background: transparent;
  color: var(--primary-500);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-style 0.15s;
  margin-top: 8px;

  svg { width: 14px; height: 14px; flex-shrink: 0; }

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--primary-500) 8%, transparent);
    border-style: solid;
  }

  &:focus-visible {
    outline: 2px solid var(--primary-500);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  // Spinner inline
  .spinner-xs {
    width: 12px;
    height: 12px;
    border: 2px solid color-mix(in srgb, var(--primary-500) 30%, transparent);
    border-top-color: var(--primary-500);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

.btn-generate-schema__hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 4px 0 0;
  text-align: center;
  line-height: 1.4;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Orden de implementación recomendado (actualizado)

```
Paso 0 — Fix en Python (CRÍTICO — hacer ANTES de tocar Angular)
  └── models.py: añadir alias_generator=to_camel + populate_by_name a:
        LogicError, Bottleneck, WorkflowAnalysisResponse,
        NodeSchemaResponse, FormField (reemplaza aliases manuales)
  └── routers/analysis.py: añadir response_model_by_alias=True
  └── routers/schema.py:   añadir response_model_by_alias=True
  └── Verificar: curl POST /api/v1/ia/analyze → JSON tiene logicErrors, isValid (camelCase)
  └── Verificar: curl POST /api/v1/ia/generate-schema → JSON tiene formSchema, sortOrder

Paso 1 — environment.ts
  └── Añadir iaApiUrl: 'http://localhost:8005'

Paso 2 — workflow.model.ts
  └── Añadir al final: WorkflowLogicError, WorkflowBottleneck, WorkflowAnalysisResult,
        WorkflowAnalysisRequest, NodeSchemaRequest, NodeSchemaResponse

Paso 3 — ai.service.ts
  └── Cambiar URL hardcodeada a environment.iaApiUrl
  └── Añadir método analyze()
  └── Añadir método generateSchema()

Paso 4 — workflow-editor.component.ts
  └── Extraer _extractNodesForAi(), _extractEdgesForAi(), _extractLanesForAi()
  └── Refactorizar pedirCambiosIA() para usar los 3 métodos privados
  └── Declarar signals: isAnalyzing, analysisResult, showAnalysisPanel, analysisError
  └── Declarar computed: analysisErrors, analysisWarnings
  └── Añadir método analyzeWorkflow()
  └── Añadir método highlightNode()
  └── Añadir método closeAnalysisPanel()

Paso 5 — editor-toolbar.component.ts + .html
  └── Añadir input isAnalyzing
  └── Añadir output analyzeClicked
  └── Añadir botón "Analizar" en el template

Paso 6 — workflow-editor.component.html
  └── Bindear (analyzeClicked) del toolbar → analyzeWorkflow()
  └── Bindear [isAnalyzing] del toolbar ← isAnalyzing()
  └── Añadir <aside class="analysis-panel"> con el HTML completo del plan
  └── Añadir toast de error de conexión

Paso 7 — workflow-editor.component.scss
  └── Añadir estilos del .analysis-panel
  └── Añadir .analysis-error-toast y @keyframes slideInRight

Paso 8 — node-panel.component.ts
  └── Inyectar AiService
  └── Declarar signal isGeneratingSchema
  └── Añadir método generateSchema()
  └── Añadir método privado _applyGeneratedSchema()

Paso 9 — node-panel.component.html
  └── Dentro de @if(isTask): añadir botón "Generar con IA" + hint

Paso 10 — node-panel.component.scss
  └── Añadir estilos de .btn-generate-schema y .btn-generate-schema__hint
```
