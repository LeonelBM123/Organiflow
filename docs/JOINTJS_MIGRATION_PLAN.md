# Plan de Migración: Syncfusion → JointJS
## Incluye: Auto-swimlanes desde Departamentos

> **Objetivo:** Reemplazar Syncfusion Diagram por JointJS en el editor de workflows.
> **Motivación principal:** El `uiSchema` de Syncfusion pesa ~33KB por broadcast de colaboración.
> JointJS (`graph.toJSON()`) produce ~4KB para el mismo diagrama (reducción del ~85%).
> **Feature integrada:** Al abrir un workflow nuevo, generar los carriles automáticamente
> desde los departamentos activos del tenant (en lugar de un canvas vacío).

---

## Inventario de impacto

### Archivos que se REESCRIBEN

| Archivo | Motivo |
|---|---|
| `workflow-editor.component.ts` | Toda la API de Syncfusion (`DiagramComponent`, `loadDiagram`, `saveDiagram`, etc.) |
| `workflow-editor.component.html` | `<ejs-diagram>` → `<div #paperEl>` |
| `workflow.mapper.ts` | 7 tipos importados de Syncfusion; serialización acoplada al formato propietario |
| `symbol-palette.component.ts` + `.html` | `SymbolPaletteModule` → drag HTML5 nativo |

### Archivos NUEVOS

| Archivo | Propósito |
|---|---|
| `services/diagram.service.ts` | Wrapper Angular de JointJS (Graph + Paper) |
| `services/jointjs-shapes.ts` | Definición de shapes custom (nodos, lanes, swimlane) |

### Archivos que NO CAMBIAN

| Archivo | Motivo |
|---|---|
| `collaboration.service.ts` | 100% agnóstico — solo STOMP/WebSocket. El `uiSchema` sigue siendo un string opaco |
| `workflow.model.ts` | Modelos de dominio puros |
| `collaboration.model.ts` | Ídem |
| `node-panel.component.ts` | Reactive form puro, sin dependencia del canvas |
| `remote-cursors.component.ts` | Solo consume signals |
| `presence-bar.component.ts` | Ídem |
| `editor-toolbar.component.ts` | Ídem |
| `workflow.service.ts` | Ídem |
| `department.service.ts` | Ya implementado, se usa como nueva dependencia |
| **Backend completo** | El campo `uiSchema` sigue siendo un string — solo cambia su contenido |

---

## Fase 0 — Dependencias

```bash
npm uninstall @syncfusion/ej2-angular-diagrams @syncfusion/ej2-angular-base @syncfusion/ej2-diagrams
npm install @joint/core
```

Eliminar de `angular.json` los estilos CSS de Syncfusion si existen.
Eliminar la licencia de Syncfusion de `main.ts` o `app.config.ts` si existe.

---

## Fase 1 — Shapes custom (`jointjs-shapes.ts`)

Crear `src/app/features/workflows/services/jointjs-shapes.ts`.

Define las formas que usará el canvas:

```typescript
import { dia, shapes } from '@joint/core';

// Colores por tipo de nodo (mismos que Syncfusion)
export const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  START:     { fill: '#059669', stroke: '#047857', text: '#ffffff' },
  END:       { fill: '#DC2626', stroke: '#B91C1C', text: '#ffffff' },
  TASK:      { fill: '#ffffff', stroke: '#E2E8F0', text: '#1E2024' },
  CONDITION: { fill: '#D97706', stroke: '#B45309', text: '#ffffff' },
  MERGE:     { fill: '#1e293b', stroke: '#0f172a', text: '#ffffff' },
  ITERATOR:  { fill: '#f0fdf4', stroke: '#10b981', text: '#1E2024' },
};

export const EDGE_COLORS: Record<string, string> = {
  SEQUENTIAL:  '#10b981',
  CONDITIONAL: '#3b82f6',
  ITERATIVE:   '#f43f5e',
  MERGE:       '#8b5cf6',
};

// Lane container (carril individual dentro del swimlane)
export class LaneCell extends shapes.standard.Rectangle {
  defaults() {
    return {
      ...super.defaults(),
      type: 'organiflow.LaneCell',
      attrs: {
        body: { fill: '#f4f7ff', stroke: '#e2e8f0', strokeWidth: 1 },
        label: { text: '', fontSize: 12, fontWeight: 'bold', fill: '#1e293b',
                 textVerticalAnchor: 'top', textAnchor: 'middle', refX: '50%', refY: 8 }
      }
    };
  }
}

// Nodos de proceso
export class WorkflowNode extends shapes.standard.Rectangle {
  defaults() {
    return {
      ...super.defaults(),
      type: 'organiflow.WorkflowNode',
      size: { width: 180, height: 70 },
      attrs: {
        body: { rx: 8, ry: 8, fill: '#ffffff', stroke: '#E2E8F0', strokeWidth: 1.5 },
        label: { fontSize: 12, fontWeight: 'bold', fill: '#1E2024' }
      }
    };
  }
}

// Nodo diamante (CONDITION)
export class ConditionNode extends shapes.standard.Polygon {
  defaults() {
    return {
      ...super.defaults(),
      type: 'organiflow.ConditionNode',
      size: { width: 100, height: 80 },
      attrs: {
        body: { points: '50,0 100,40 50,80 0,40',
                fill: '#D97706', stroke: '#B45309', strokeWidth: 2 },
        label: { fontSize: 11, fontWeight: 'bold', fill: '#ffffff' }
      }
    };
  }
}

// Registrar todos los shapes
export function registerShapes() {
  Object.assign(shapes, {
    'organiflow.LaneCell':     LaneCell,
    'organiflow.WorkflowNode': WorkflowNode,
    'organiflow.ConditionNode': ConditionNode,
  });
}
```

---

## Fase 2 — DiagramService (`diagram.service.ts`)

Crear `src/app/features/workflows/services/diagram.service.ts`.

Este servicio es el único punto de contacto con JointJS.
Encapsula `Graph` y `Paper`, expone una API limpia hacia Angular.

```typescript
// API que expone el servicio:

/** Monta el Paper en un elemento DOM */
mount(containerEl: HTMLElement): void

/** Carga el grafo desde JSON (equivale a diagram.loadDiagram) */
loadGraph(json: object): void

/** Serializa el grafo a JSON (equivale a diagram.saveDiagram) */
saveGraph(): string  // ~4KB en lugar de ~33KB

/** Observable que emite cada vez que el usuario cambia el grafo */
readonly change$: Observable<void>

/** Observable que emite el elemento seleccionado */
readonly selection$: Observable<dia.Element | null>

/** Obtener elemento por ID */
getElement(id: string): dia.Element | undefined

/** Actualizar atributos de un elemento sin redibujar todo */
updateElement(id: string, attrs: object): void

/** Limpiar y destruir el Paper al destruir el componente */
destroy(): void
```

**Puntos clave de implementación:**

- `change$` usa `fromEventPattern` sobre `graph.on('change add remove')` con throttle de 600ms
  (equivale al `collectionChange` + `positionChange` de Syncfusion).
- `selection$` usa `paper.on('element:pointerclick')`.
- **Fuera de NgZone** para no disparar change detection en cada evento del canvas.
- Entrar a NgZone solo cuando se emite hacia Angular (signals, observables).

---

## Fase 3 — WorkflowMapper reescritura

Reescribir `workflow.mapper.ts` eliminando todos los imports de Syncfusion.

### 3.1 — `toJointJS(workflow)` (antiguo `toSyncfusion`)

Convierte `WorkflowResponse` a celdas JointJS.
Retorna `{ cells: dia.Cell[] }`.

**Estructura de swimlane en JointJS (embedding):**

```
SwimlaneContainer (Rectangle invisible, padre de todo)
  └── LaneCell "Comercial"   (id: dept.id, embeds: [node-1, node-2])
  └── LaneCell "Técnico"     (id: dept.id, embeds: [node-3])
  └── LaneCell "Instalación" (id: dept.id, embeds: [])
```

En JointJS el embedding se gestiona con:
```typescript
lane.embed(nodeElement);           // asigna parent
swimlane.embed(lane);              // anida lanes en el contenedor
```

Al mover el swimlane, todos los hijos se mueven con él.

### 3.2 — `fromJointJS(graph)` (antiguo `toApiRequest`)

Lee `graph.toJSON()` y extrae `WorkflowSaveRequest` con `lanes`, `nodes`, `edges`, `uiSchema`.

La lógica de extracción de `laneId` usa el atributo `parent` de cada celda.

### 3.3 — `departmentsToLanes(departments)` ← **NUEVA función (auto-lanes)**

```typescript
static departmentsToLanes(departments: Department[]): WorkflowLane[] {
  const PASTEL = ['#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb', '#fef2f2', '#f0f9ff'];
  return departments
    .filter(d => d.isActive)
    .map((d, i) => ({
      id: d.id,
      name: d.name,
      role: 'officer' as const,
      height: 600,
      color: PASTEL[i % PASTEL.length],
      sortOrder: i + 1
    }));
}
```

---

## Fase 4 — SymbolPalette reescritura

Reemplazar `SymbolPaletteModule` por drag HTML5 nativo.

**Template nuevo (simplificado):**
```html
<aside class="palette" aria-label="Elementos del diagrama">
  @for (item of paletteItems(); track item.id) {
    <div
      class="palette-item"
      [attr.draggable]="true"
      [attr.data-type]="item.type"
      (dragstart)="onDragStart($event, item)"
      [attr.aria-label]="item.tooltip"
      role="button"
      tabindex="0">
      <svg ...><!-- icono SVG del tipo de nodo --></svg>
      <span>{{ item.label }}</span>
    </div>
  }
</aside>
```

**En DiagramService:**
```typescript
// El Paper escucha el drop
paper.on('blank:drop', (evt, x, y) => {
  const type = evt.dataTransfer.getData('node-type');
  this.createNodeAt(type, x, y);
});
```

Los swimlanes/lanes de la paleta también usan drag-drop:
al soltar un "Nuevo carril" sobre el canvas, se crea una `LaneCell` y se embebe en el swimlane existente.

---

## Fase 5 — WorkflowEditorComponent reescritura

### 5.1 — Template

```html
<!-- Antes -->
<ejs-diagram #diagram id="organiflow-diagram" ...></ejs-diagram>

<!-- Después -->
<div #paperEl id="organiflow-diagram" class="paper-container"
     role="img" aria-label="Editor visual de workflow"></div>
```

### 5.2 — Dependencias inyectadas

```typescript
// Se agrega:
private readonly diagramService = inject(DiagramService);
private readonly departmentService = inject(DepartmentService);

// Se elimina:
// @ViewChild('diagram') diagram!: DiagramComponent;
// import de DiagramModule, DiagramTools, SnapSettingsModel, etc.
```

### 5.3 — ngAfterViewInit

```typescript
ngAfterViewInit(): void {
  this.diagramService.mount(this.paperEl.nativeElement);
  // El Paper ya está listo; ahora cargamos el workflow
}
```

### 5.4 — loadWorkflow con auto-lanes integrado

```typescript
loadWorkflow(): void {
  this.isLoading.set(true);

  this.workflowService.findById(this.workflowId()).subscribe({
    next: (workflow) => {
      this.workflow.set(workflow);
      this.isLoading.set(false);

      if (workflow.uiSchema) {
        // Workflow existente — cargar JSON de JointJS directamente
        this.isLoadingDiagram = true;
        this.diagramService.loadGraph(JSON.parse(workflow.uiSchema));
        setTimeout(() => {
          this.isLoadingDiagram = false;
          this.initCollaboration();
        }, 100);

      } else if (workflow.lanes.length > 0) {
        // Tiene lanes guardadas pero sin uiSchema (caso borde)
        const cells = WorkflowMapper.toJointJS(workflow);
        this.diagramService.loadGraph({ cells });
        this.initCollaboration();

      } else {
        // ✨ WORKFLOW NUEVO — generar swimlanes desde departamentos
        this.departmentService.findAll().subscribe({
          next: (departments) => {
            const lanes = WorkflowMapper.departmentsToLanes(departments);
            const cells = WorkflowMapper.toJointJS({ ...workflow, lanes });
            this.diagramService.loadGraph({ cells });

            // Persistir el estado inicial para no re-generar la próxima vez
            setTimeout(() => this.saveGraph(), 200);
            this.initCollaboration();
          },
          error: () => {
            // Si falla la carga de departamentos, canvas vacío
            this.initCollaboration();
          }
        });
      }
    },
    error: () => {
      this.isLoading.set(false);
      this.router.navigate(['/admin/workflows']);
    }
  });
}
```

### 5.5 — Suscripción a cambios del grafo

```typescript
private subscribeToGraphChanges(): void {
  this.diagramService.change$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(() => {
    if (this.isLoadingDiagram || this.isApplyingRemoteChange) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
  });

  this.diagramService.selection$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(element => {
    const nodeData = element
      ? this.resolveNodeData(element.id, element.attributes)
      : null;
    this.zone.run(() => {
      this.selectedNode.set(nodeData);
      this.cdr.detectChanges();
    });
  });
}
```

### 5.6 — applyRemoteChange (sin cambios conceptuales)

```typescript
// La bandera isApplyingRemoteChange se mantiene EXACTAMENTE igual
private applyRemoteChange(uiSchema: string): void {
  if (!uiSchema) return;
  this.isApplyingRemoteChange = true;
  try {
    this.diagramService.loadGraph(JSON.parse(uiSchema));
  } catch (err) {
    console.error('[Editor] Error en applyRemoteChange:', err);
  }
  setTimeout(() => { this.isApplyingRemoteChange = false; }, 400);
}
```

### 5.7 — sendDiagramChanged

```typescript
private sendDiagramChanged(): void {
  if (this.isApplyingRemoteChange || this.isLoadingDiagram) return;
  if (this.workflow()?.status !== 'DRAFT') return;
  const uiSchema = this.diagramService.saveGraph(); // ~4KB en lugar de 33KB
  this.collaborationService.sendChanged(this.workflowId(), uiSchema);
}
```

### 5.8 — saveGraph

```typescript
saveGraph(): void {
  if (this.workflow()?.status === 'ARCHIVED') return;

  let request: WorkflowSaveRequest;
  try {
    request = WorkflowMapper.fromJointJS(this.diagramService.getGraph());
  } catch (e) {
    this.saveStatus.set('error');
    return;
  }
  // ... resto igual que hoy
}
```

---

## Fase 6 — Verificación de colaboración

`collaboration.service.ts` **no cambia ni una línea**.

Lo único que cambia es el contenido del `uiSchema`:

| Antes (Syncfusion) | Después (JointJS) |
|---|---|
| ~33KB por broadcast | ~4KB por broadcast |
| Formato `{ nodes: [...], connectors: [...], scrollSettings: {...}, ... }` | Formato `{ cells: [...] }` |
| `diagram.loadDiagram(uiSchema)` | `graph.fromJSON(JSON.parse(uiSchema))` |

El backend almacena y retransmite el string sin interpretarlo — cero cambios backend.

---

## Orden de implementación

```
Fase 0 — npm uninstall/install                         (15 min)
Fase 1 — jointjs-shapes.ts                             (2h)
Fase 2 — DiagramService                                (4h)
Fase 3 — WorkflowMapper reescritura                   (3h)
          ↳ incluye departmentsToLanes()
Fase 4 — SymbolPalette reescritura                    (3h)
Fase 5 — WorkflowEditorComponent reescritura          (4h)
          ↳ incluye auto-lanes en loadWorkflow()
Fase 6 — Test de colaboración                         (1h)
```

---

## Decisiones de diseño clave

### ¿Por qué `DiagramService` y no lógica directa en el componente?
El componente debe ser agnóstico de la librería de canvas.
Si en el futuro se cambia JointJS por otra librería, solo cambia el servicio.

### ¿Por qué auto-save después de crear swimlanes desde departamentos?
El `setTimeout(() => saveGraph(), 200)` persiste las lanes en MongoDB.
La próxima vez que se abra el workflow, `workflow.lanes.length > 0` y no se vuelve a llamar a `findAll()`.

### ¿Qué pasa con los uiSchemas viejos de Syncfusion en MongoDB?
Durante el desarrollo (sin datos de producción): al abrir un workflow con `uiSchema` viejo,
`JSON.parse(uiSchema)` tendrá un formato Syncfusion que JointJS no entiende.
Solución: en `loadWorkflow()`, detectar si el JSON tiene clave `nodes` (Syncfusion) vs `cells` (JointJS)
y tratar el formato Syncfusion como si fuera `uiSchema = null` (regenera desde `workflow.lanes`).

```typescript
// Guard en loadWorkflow:
const parsed = JSON.parse(workflow.uiSchema);
const isJointFormat = Array.isArray(parsed.cells);
if (!isJointFormat) {
  // Tratar como workflow sin uiSchema — usar workflow.lanes o departamentos
}
```

### ¿Qué pasa si el tenant no tiene departamentos registrados?
El canvas abre vacío (igual que hoy). El usuario puede agregar lanes manualmente
desde la paleta. No hay error ni bloqueo.
