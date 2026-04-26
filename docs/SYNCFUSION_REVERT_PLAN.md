# Plan de Reversión: JointJS → Syncfusion UML Activity + Swimlane

> **Objetivo:** Volver a Syncfusion Diagram usando **UML Activity Diagram** con **Swimlanes** nativos.
> Los nodos del workflow se mapearán a formas estándar UML Activity (Action, Decision, InitialNode, FinalNode, ForkNode).
> La colaboración en tiempo real sigue siendo idéntica — el `uiSchema` sigue siendo un string opaco para el backend.

---

## Inventario de cambios

### Archivos que se ELIMINAN
| Archivo | Motivo |
|---|---|
| `services/diagram.service.ts` | Wrapper de JointJS — ya no se necesita |
| `services/jointjs-shapes.ts` | Definición de shapes de JointJS |

### Archivos que se REESCRIBEN
| Archivo | Motivo |
|---|---|
| `workflow-editor.component.ts` | Vuelve a usar `DiagramComponent` de Syncfusion |
| `workflow-editor.component.html` | `<div #paperEl>` → `<ejs-diagram>` |
| `workflow.mapper.ts` | Mapeo a UML Activity + Swimlane de Syncfusion |
| `symbol-palette.component.ts/.html` | Vuelve a usar `ejs-symbol-palette` |
| `angular.json` | Restaurar estilos CSS de Syncfusion |
| `main.ts` | Restaurar registro de licencia de Syncfusion |

### Archivos que NO CAMBIAN
| Archivo | Motivo |
|---|---|
| `collaboration.service.ts` | 100 % agnóstico del canvas |
| `collaboration.model.ts` | Ídem |
| `workflow.model.ts` | Modelos de dominio puros |
| `workflow.service.ts` | Ídem |
| `node-panel.component.ts` | Reactive form puro |
| `remote-cursors.component.ts` | Solo consume signals |
| `presence-bar.component.ts` | Ídem |
| `editor-toolbar.component.ts` | Ídem |
| **Backend completo** | `uiSchema` sigue siendo un string — solo cambia su contenido |

---

## Fase 0 — Dependencias

```bash
# Desinstalar JointJS
npm uninstall @joint/core

# Instalar Syncfusion
npm install @syncfusion/ej2-angular-diagrams @syncfusion/ej2-angular-base @syncfusion/ej2-diagrams
```

### `angular.json` — restaurar estilos CSS de Syncfusion
```json
"styles": [
  "src/styles.scss",
  "node_modules/@syncfusion/ej2-angular-diagrams/styles/material.css",
  "node_modules/@syncfusion/ej2-base/styles/material.css"
]
```

### `main.ts` — restaurar licencia
```typescript
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('TU_LICENCIA_AQUI');
```

### `index.html` — eliminar cualquier import de JointJS si existe

---

## Fase 1 — Referencia de shapes UML Activity

Syncfusion implementa el estándar UML Activity con el tipo `'UMLActivity'`.

### Mapa: Tipo de nodo Organiflow → Shape Syncfusion

| Tipo Organiflow | Shape Syncfusion | Visual |
|---|---|---|
| `START` | `UMLActivity / InitialNode` | Círculo negro relleno |
| `END` | `UMLActivity / FinalNode` | Círculo con punto interior |
| `TASK` | `UMLActivity / Action` | Rectángulo con esquinas redondeadas |
| `ITERATOR` | `UMLActivity / Action` | Rectángulo redondeado (con anotación de iteración) |
| `CONDITION` | `UMLActivity / DecisionNode` | Diamante |
| `MERGE` | `UMLActivity / JoinNode` | Barra horizontal gruesa |

### Mapa: Tipo de relación → Estilo de conector Syncfusion

| Tipo | Estilo línea | Color |
|---|---|---|
| `SEQUENTIAL` | Sólido | `#10b981` |
| `CONDITIONAL` | Discontinuo (`4 3`) | `#3b82f6` |
| `ITERATIVE` | Discontinuo (`4 3`) | `#f43f5e` |
| `MERGE` | Sólido | `#8b5cf6` |

### Colores por tipo (para resaltar visualmente en la Action box)

```typescript
export const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  START:     { fill: '#059669', stroke: '#047857', text: '#ffffff' },
  END:       { fill: '#DC2626', stroke: '#B91C1C', text: '#ffffff' },
  TASK:      { fill: '#ffffff', stroke: '#E2E8F0', text: '#1E2024' },
  CONDITION: { fill: '#D97706', stroke: '#B45309', text: '#ffffff' },
  MERGE:     { fill: '#1e293b', stroke: '#0f172a', text: '#ffffff' },
  ITERATOR:  { fill: '#f0fdf4', stroke: '#10b981', text: '#1E2024' },
};
```

---

## Fase 2 — WorkflowMapper reescritura

Archivo: `src/app/features/workflows/services/workflow.mapper.ts`

Eliminar todos los imports de JointJS. El mapper trabaja con los tipos de `@syncfusion/ej2-angular-diagrams`.

### Imports necesarios

```typescript
import {
  DiagramModel, NodeModel, ConnectorModel, SwimLaneModel,
  LaneModel, UmlActivityShapeModel, PathAnnotationModel,
  ShapeAnnotationModel,
} from '@syncfusion/ej2-angular-diagrams';
import { WorkflowResponse, WorkflowSaveRequest, WorkflowNode, WorkflowEdge, WorkflowLane } from '../models/workflow.model';
import { Department } from '../../departments/models/department.model';
```

### 2.1 — `toSyncfusion(workflow)` (antiguo `toJointJS`)

Genera el objeto `DiagramModel` que se pasa a `diagram.loadDiagram()`.

**Estructura de swimlane en Syncfusion:**
```
NodeModel (type: 'SwimLane')
  ├── header: { content: workflow.name }
  ├── orientation: 'Horizontal'   ← carriles apilados verticalmente
  └── lanes: LaneModel[]
        ├── LaneModel { header: 'Comercial', children: [ChildNode...] }
        ├── LaneModel { header: 'Técnico',   children: [ChildNode...] }
        └── LaneModel { header: 'Instalación', children: [] }
```

```typescript
static toSyncfusion(workflow: WorkflowResponse): Partial<DiagramModel> {
  const sortedLanes = [...workflow.lanes].sort((a, b) => a.sortOrder - b.sortOrder);

  const lanes: LaneModel[] = sortedLanes.map((lane, i) => ({
    id: `lane_${lane.id}`,
    header: {
      content: lane.name,
      style: { fontSize: 12, fontWeight: 'Bold', fill: '#f8fafc', strokeColor: '#cbd5e1' },
    },
    height: lane.height ?? 200,
    style: { fill: lane.color ?? LANE_PASTEL_COLORS[i % LANE_PASTEL_COLORS.length], strokeColor: '#e2e8f0' },
    // Nodos que pertenecen a este carril
    children: workflow.nodes
      .filter(n => n.laneId === lane.id)
      .map(n => WorkflowMapper.nodeToChildNode(n)),
  }));

  const swimlane: NodeModel = {
    id: 'swimlane-main',
    shape: {
      type: 'SwimLane',
      orientation: 'Horizontal',
      header: {
        content: workflow.name,
        style: { fontSize: 14, fontWeight: 'Bold', fill: '#f1f5f9', strokeColor: '#cbd5e1' },
      },
      lanes,
      phases: [],
    } as SwimLaneModel,
    offsetX: 400,
    offsetY: 300,
  };

  const connectors: ConnectorModel[] = workflow.edges.map(e => WorkflowMapper.edgeToConnector(e));

  return {
    nodes: [swimlane],
    connectors,
    scrollSettings: { scrollLimit: 'Infinity' },
  };
}
```

### 2.2 — `nodeToChildNode(node)` — nodo interno al swimlane

Los nodos que viven dentro de un Lane son `NodeModel` normales que Syncfusion posiciona con `offsetX/Y` relativo al lane.

```typescript
private static nodeToChildNode(node: WorkflowNode): NodeModel {
  const colors = NODE_COLORS[node.type] ?? NODE_COLORS['TASK'];

  const base: NodeModel = {
    id: node.id,
    offsetX: node.offsetX || 100,
    offsetY: node.offsetY || 100,
    width:   node.width  || WorkflowMapper.defaultWidth(node.type),
    height:  node.height || WorkflowMapper.defaultHeight(node.type),
    style:   { fill: colors.fill, strokeColor: colors.stroke, strokeWidth: 2 },
    annotations: node.name ? [{
      content: node.name,
      style:   { color: colors.text, fontSize: 11, bold: true },
    }] : [],
    // Almacenar metadata Organiflow en addInfo para recuperarla en fromSyncfusion
    addInfo: {
      organiflowType: node.type,
      laneId:         node.laneId,
      assignedRole:   node.assignedRole,
      assignedUserId: node.assignedUserId,
      timeoutHours:   node.timeoutHours,
      formSchema:     node.formSchema,
      aiConfig:       node.aiConfig,
      status:         node.status ?? 'PENDING',
    },
  };

  switch (node.type) {
    case 'START':
      return { ...base, shape: { type: 'UMLActivity', shape: 'InitialNode' } as UmlActivityShapeModel };
    case 'END':
      return { ...base, shape: { type: 'UMLActivity', shape: 'FinalNode' } as UmlActivityShapeModel };
    case 'CONDITION':
      return { ...base, shape: { type: 'UMLActivity', shape: 'DecisionNode' } as UmlActivityShapeModel };
    case 'MERGE':
      return { ...base, shape: { type: 'UMLActivity', shape: 'JoinNode' } as UmlActivityShapeModel };
    case 'TASK':
    case 'ITERATOR':
    default:
      return { ...base, shape: { type: 'UMLActivity', shape: 'Action' } as UmlActivityShapeModel };
  }
}

private static defaultWidth(type: string): number {
  switch (type) {
    case 'START': case 'END': return 40;
    case 'CONDITION': return 80;
    case 'MERGE': return 80;
    default: return 160;
  }
}

private static defaultHeight(type: string): number {
  switch (type) {
    case 'START': case 'END': return 40;
    case 'CONDITION': return 60;
    case 'MERGE': return 20;
    default: return 60;
  }
}
```

### 2.3 — `fromSyncfusion(diagram)` (antiguo `fromJointJS`)

Lee el estado del `DiagramComponent` y produce el `WorkflowSaveRequest`.

```typescript
static fromSyncfusion(diagram: DiagramComponent): WorkflowSaveRequest {
  const lanes:   WorkflowLane[]  = [];
  const nodes:   WorkflowNode[]  = [];
  const edges:   WorkflowEdge[]  = [];

  // Encontrar el nodo swimlane principal
  const swimlaneNode = diagram.nodes.find(n => n.shape?.type === 'SwimLane');
  if (swimlaneNode) {
    const swimShape = swimlaneNode.shape as SwimLaneModel;
    swimShape.lanes?.forEach((lane, i) => {
      const laneId = lane.id?.replace('lane_', '') ?? `lane-${i}`;
      lanes.push({
        id:        laneId,
        name:      (lane.header?.content as string) || `Carril ${i + 1}`,
        role:      'officer',
        height:    lane.height ?? 200,
        color:     (lane.style?.fill as string) ?? '#f4f7ff',
        sortOrder: i + 1,
      });

      lane.children?.forEach(child => {
        const addInfo = (child.addInfo ?? {}) as Record<string, unknown>;
        nodes.push({
          id:             child.id!,
          laneId,
          name:           (child.annotations?.[0]?.content as string) ?? '',
          type:           (addInfo['organiflowType'] as string) ?? 'TASK',
          status:         (addInfo['status'] as string) as NodeStatus | undefined,
          shape:          { type: child.shape?.type ?? '', shape: '' },
          offsetX:        child.offsetX ?? 0,
          offsetY:        child.offsetY ?? 0,
          width:          child.width ?? 160,
          height:         child.height ?? 60,
          annotations:    [],
          ports:          [],
          assignedRole:   addInfo['assignedRole'] as string | undefined,
          assignedUserId: addInfo['assignedUserId'] as string | undefined,
          timeoutHours:   addInfo['timeoutHours'] as number | undefined,
          formSchema:     addInfo['formSchema'] as FormSchema | undefined,
          aiConfig:       addInfo['aiConfig'] as AiConfig | undefined,
        });
      });
    });
  }

  // Conectores
  diagram.connectors.forEach(conn => {
    const addInfo = (conn.addInfo ?? {}) as Record<string, unknown>;
    if (!conn.sourceID || !conn.targetID) return;
    edges.push({
      id:            conn.id!,
      sourceId:      conn.sourceID,
      targetId:      conn.targetID,
      sourcePortId:  conn.sourcePortID,
      targetPortId:  conn.targetPortID,
      relationType:  (addInfo['relationType'] as string) ?? 'SEQUENTIAL',
      label:         (conn.annotations?.[0]?.content as string) ?? '',
      conditionRule: addInfo['conditionRule'] as string | undefined,
      priority:      (addInfo['priority'] as number) ?? 1,
      style: {
        strokeColor: (conn.style?.strokeColor as string) ?? '#10b981',
        strokeWidth: (conn.style?.strokeWidth as number) ?? 2,
      },
    });
  });

  return {
    lanes,
    nodes,
    edges,
    uiSchema: diagram.saveDiagram(),
  };
}
```

### 2.4 — `edgeToConnector(edge)` — conector Syncfusion

```typescript
private static edgeToConnector(edge: WorkflowEdge): ConnectorModel {
  const isDashed = edge.relationType === 'CONDITIONAL' || edge.relationType === 'ITERATIVE';
  const color    = EDGE_COLORS[edge.relationType] ?? '#10b981';

  return {
    id:         edge.id,
    sourceID:   edge.sourceId,
    targetID:   edge.targetId,
    sourcePortID: edge.sourcePortId,
    targetPortID: edge.targetPortId,
    type:       'Orthogonal',
    style: {
      strokeColor: color,
      strokeWidth: 2,
      strokeDashArray: isDashed ? '4 3' : undefined,
    },
    targetDecorator: { shape: 'Arrow', style: { fill: color, strokeColor: color } },
    annotations: edge.label ? [{ content: edge.label, style: { fontSize: 10, color: '#64748B' } }] : [],
    addInfo: {
      relationType:  edge.relationType,
      conditionRule: edge.conditionRule,
      priority:      edge.priority ?? 1,
    },
  };
}
```

### 2.5 — `departmentsToLanes` y `isSyncfusionSchema`

`departmentsToLanes` no cambia — devuelve `WorkflowLane[]` y no depende del canvas.

```typescript
// Eliminar la función isSyncfusionSchema — ya no se necesita detección de formato legacy.
// Todo uiSchema nuevo vendrá de Syncfusion.
```

---

## Fase 3 — WorkflowEditorComponent reescritura

### 3.1 — Template (`workflow-editor.component.html`)

```html
<div class="editor-root">

  <app-editor-toolbar ...></app-editor-toolbar>

  <div class="editor-body">

    <ejs-symbol-palette
      id="symbolpalette"
      [expandMode]="'Multiple'"
      [palettes]="palettes"
      [width]="'100%'"
      [height]="'100%'"
      [symbolHeight]="48"
      [symbolWidth]="48"
      [symbolMargin]="{ left: 8, right: 8, top: 8, bottom: 8 }"
    ></ejs-symbol-palette>

    <div class="canvas-wrapper" [class.loading]="isLoading()">

      @if (isLoading()) {
        <div class="canvas-loading">
          <div class="spinner"></div>
          <span>Cargando diagrama...</span>
        </div>
      }

      <div [class.hidden]="isLoading()" style="position:relative;width:100%;height:100%">
        <ejs-diagram
          #diagram
          id="organiflow-diagram"
          width="100%"
          height="100%"
          [snapSettings]="snapSettings"
          [layout]="{ type: 'None' }"
          [tool]="tool"
          (collectionChange)="onCollectionChange()"
          (positionChange)="onPositionChange()"
          (sizeChange)="onSizeChange()"
          (connectionChange)="onConnectionChange()"
          (click)="onDiagramClick($event)"
          (doubleClick)="onDiagramDblClick($event)"
        ></ejs-diagram>

        <app-remote-cursors [cursors]="remoteCursors()"></app-remote-cursors>
      </div>

    </div>

    <app-node-panel
      [node]="selectedNode()"
      (save)="onNodePropertiesSaved($event)"
      (close)="selectedNode.set(null)"
    ></app-node-panel>

  </div>
</div>
```

### 3.2 — Imports del componente

```typescript
import {
  DiagramModule, SymbolPaletteModule, DiagramComponent,
  UndoRedoService, PrintAndExportService,
  NodeModel, ConnectorModel, PaletteModel,
  DiagramTools, SnapSettingsModel, SnapConstraints,
  UMLActivityShapes,
} from '@syncfusion/ej2-angular-diagrams';

// Eliminar:
// import { DiagramService } from '../../services/diagram.service';
// import { LaneCell, WorkflowTaskNode, ... } from '../../services/jointjs-shapes';
// import { dia } from '@joint/core';
```

### 3.3 — Decorator

```typescript
@Component({
  selector: 'app-workflow-editor',
  imports: [
    DiagramModule,
    SymbolPaletteModule,
    EditorToolbarComponent,
    NodePanelComponent,
    RemoteCursorsComponent,
  ],
  templateUrl: './workflow-editor.component.html',
  styleUrl: './workflow-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CollaborationService,
    UndoRedoService,
    PrintAndExportService,
  ],
})
```

### 3.4 — ViewChild y configuración del diagrama

```typescript
@ViewChild('diagram') diagram!: DiagramComponent;

readonly snapSettings: SnapSettingsModel = {
  constraints: SnapConstraints.ShowLines | SnapConstraints.SnapToLines,
  gridType: 'Dot',
};

readonly tool = DiagramTools.Default;

readonly palettes: PaletteModel[] = [
  {
    id: 'uml-activity',
    title: 'UML Activity',
    symbols: [
      {
        id: 'start-symbol',
        shape: { type: 'UMLActivity', shape: 'InitialNode' },
        style: { fill: '#059669', strokeColor: '#047857' },
        width: 40, height: 40,
        annotations: [{ content: 'Inicio' }],
        addInfo: { organiflowType: 'START' },
      },
      {
        id: 'end-symbol',
        shape: { type: 'UMLActivity', shape: 'FinalNode' },
        style: { fill: '#DC2626', strokeColor: '#B91C1C' },
        width: 40, height: 40,
        annotations: [{ content: 'Fin' }],
        addInfo: { organiflowType: 'END' },
      },
      {
        id: 'task-symbol',
        shape: { type: 'UMLActivity', shape: 'Action' },
        style: { fill: '#ffffff', strokeColor: '#E2E8F0' },
        width: 160, height: 60,
        annotations: [{ content: 'Tarea' }],
        addInfo: { organiflowType: 'TASK' },
      },
      {
        id: 'iterator-symbol',
        shape: { type: 'UMLActivity', shape: 'Action' },
        style: { fill: '#f0fdf4', strokeColor: '#10b981' },
        width: 160, height: 60,
        annotations: [{ content: '↻ Iterador' }],
        addInfo: { organiflowType: 'ITERATOR' },
      },
      {
        id: 'condition-symbol',
        shape: { type: 'UMLActivity', shape: 'DecisionNode' },
        style: { fill: '#D97706', strokeColor: '#B45309' },
        width: 80, height: 60,
        annotations: [{ content: 'Decisión' }],
        addInfo: { organiflowType: 'CONDITION' },
      },
      {
        id: 'merge-symbol',
        shape: { type: 'UMLActivity', shape: 'JoinNode' },
        style: { fill: '#1e293b', strokeColor: '#0f172a' },
        width: 80, height: 20,
        annotations: [{ content: 'Unión' }],
        addInfo: { organiflowType: 'MERGE' },
      },
    ],
  },
];
```

### 3.5 — loadWorkflow con Syncfusion

```typescript
private populateCanvas(workflow: WorkflowResponse): void {
  if (workflow.uiSchema) {
    try {
      // Detectar uiSchema de JointJS (legado de la migración) y descartarlo
      const parsed = JSON.parse(workflow.uiSchema);
      if (parsed.cells) {
        // Formato JointJS — tratar como workflow sin uiSchema
        this.populateFromLanesOrDepartments(workflow);
        return;
      }
    } catch { /* malformed — fall through */ }

    this.isLoadingDiagram = true;
    this.diagram.loadDiagram(workflow.uiSchema);
    setTimeout(() => {
      this.isLoadingDiagram = false;
      this.initCollaboration();
    }, 100);

  } else {
    this.populateFromLanesOrDepartments(workflow);
  }
}
```

### 3.6 — saveGraph con Syncfusion

```typescript
saveGraph(): void {
  if (!this.diagram) return;
  if (this.isSaving()) return;
  if (this.workflow()?.status === 'ARCHIVED') return;

  let request: WorkflowSaveRequest;
  try {
    request = WorkflowMapper.fromSyncfusion(this.diagram);
  } catch (e) {
    console.error('[Editor] Error al serializar el diagrama:', e);
    this.saveStatus.set('error');
    return;
  }

  if (!request.uiSchema || request.uiSchema === '{}') return;

  // Preservar metadata de nodos no almacenada en el canvas
  const stateNodes = this.workflow()?.nodes ?? [];
  if (stateNodes.length > 0) {
    request.nodes = request.nodes.map(n => {
      const s = stateNodes.find(sn => sn.id === n.id);
      return s ? { ...n, name: s.name ?? n.name, assignedRole: s.assignedRole ?? n.assignedRole,
        assignedUserId: s.assignedUserId ?? n.assignedUserId, timeoutHours: s.timeoutHours ?? n.timeoutHours,
        formSchema: s.formSchema ?? n.formSchema, aiConfig: s.aiConfig ?? n.aiConfig } : n;
    });
  }

  this.isSaving.set(true);
  this.saveStatus.set('saving');

  this.workflowService.saveGraph(this.workflowId(), request).pipe(
    finalize(() => this.isSaving.set(false)),
  ).subscribe({
    next:  (wf) => { this.workflow.set(wf); this.saveStatus.set('saved'); },
    error: () => this.saveStatus.set('error'),
  });
}
```

### 3.7 — applyRemoteChange con Syncfusion

```typescript
private applyRemoteChange(uiSchema: string): void {
  if (!uiSchema || !this.diagram) return;
  this.isApplyingRemoteChange = true;
  this.zone.run(() => { this.selectedNode.set(null); this.cdr.detectChanges(); });
  try {
    this.diagram.loadDiagram(uiSchema);
  } catch (err) {
    console.error('[Editor] Error en applyRemoteChange:', err);
  }
  // 400 ms es suficiente con Syncfusion — los eventos de colección
  // no tienen el throttle de 600 ms que tenía JointJS.
  setTimeout(() => { this.isApplyingRemoteChange = false; }, 400);
}
```

### 3.8 — sendDiagramChanged con Syncfusion

```typescript
private sendDiagramChanged(): void {
  if (!this.diagram) return;
  if (this.isApplyingRemoteChange || this.isLoadingDiagram) return;
  if (this.workflow()?.status !== 'DRAFT') return;
  try {
    const uiSchema = this.diagram.saveDiagram();
    if (!uiSchema || uiSchema === '{}') return;
    this.collaborationService.sendChanged(this.workflowId(), uiSchema);
  } catch { /* non-critical */ }
}
```

### 3.9 — Suscripción a eventos del diagrama

En lugar de `subscribeToGraphEvents()` con JointJS observables, los eventos son callbacks del template:

```typescript
private readonly changeSubject = new Subject<void>();

onCollectionChange(): void { this.onDiagramChanged(); }
onPositionChange(): void   { this.onDiagramChanged(); }
onSizeChange(): void       { this.onDiagramChanged(); }
onConnectionChange(): void { this.onDiagramChanged(); }

private onDiagramChanged(): void {
  if (this.isLoadingDiagram || this.isApplyingRemoteChange) return;
  if (this.workflow()?.status !== 'DRAFT') return;
  this.saveStatus.set('unsaved');
  this.saveSubject.next();
  this.collabChangeSubject.next();
}
```

Los subjects se configuran en `ngOnInit`:

```typescript
ngOnInit(): void {
  this.workflowId.set(this.route.snapshot.params['id']);
  this.loadWorkflow();

  this.saveSubject.pipe(
    debounceTime(2000),
    takeUntil(this.destroy$),
  ).subscribe(() => this.saveGraph());

  this.collabChangeSubject.pipe(
    debounceTime(600),
    takeUntil(this.destroy$),
  ).subscribe(() => this.sendDiagramChanged());
}
```

> **Nota:** Con Syncfusion ya no hay throttle en los eventos de cambio, por lo que el timeout de `isApplyingRemoteChange` puede volver a 400 ms (en lugar de los 700 ms necesarios con JointJS).

### 3.10 — Selección de nodo

```typescript
onDiagramClick(event: IClickEventArgs): void {
  const element = event.element;
  if (!element || !('addInfo' in element)) {
    this.zone.run(() => { this.selectedNode.set(null); this.cdr.detectChanges(); });
    return;
  }
  const node = element as NodeModel;
  const nodeData = this.resolveNodeData(node.id!, node.addInfo as Record<string, unknown>);
  this.zone.run(() => { this.selectedNode.set(nodeData); this.cdr.detectChanges(); });
}

onDiagramDblClick(event: IDoubleClickEventArgs): void {
  const element = event.element;
  if (!element || !('addInfo' in element)) return;
  const node = element as NodeModel;
  const nodeData = this.resolveNodeData(node.id!, node.addInfo as Record<string, unknown>);
  if (nodeData) {
    this.zone.run(() => { this.selectedNode.set(nodeData); this.cdr.detectChanges(); });
  }
}
```

### 3.11 — onNodePropertiesSaved con Syncfusion

```typescript
onNodePropertiesSaved(updatedNode: WorkflowNode): void {
  const wf = this.workflow();
  if (!wf) return;

  this.workflow.update(w => {
    if (!w) return w;
    const exists = w.nodes.some(n => n.id === updatedNode.id);
    return {
      ...w,
      nodes: exists
        ? w.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
        : [...w.nodes, updatedNode],
    };
  });

  // Actualizar el nodo en el diagrama Syncfusion
  const diagramNode = this.diagram.getNodeObject(updatedNode.id);
  if (diagramNode) {
    // Actualizar texto de la anotación
    this.diagram.clearSelection();
    const ann = diagramNode.annotations?.[0];
    if (ann) {
      this.diagram.updateAnnotation(diagramNode as NodeModel, ann,
        { content: updatedNode.name });
    }
    // Actualizar addInfo con la metadata nueva
    diagramNode.addInfo = {
      ...(diagramNode.addInfo as object),
      name:           updatedNode.name,
      assignedRole:   updatedNode.assignedRole,
      assignedUserId: updatedNode.assignedUserId,
      timeoutHours:   updatedNode.timeoutHours,
      formSchema:     updatedNode.formSchema,
      aiConfig:       updatedNode.aiConfig,
    };
    this.diagram.dataBind();
  }

  this.selectedNode.set(null);
  this.saveStatus.set('unsaved');
  this.saveSubject.next();
  this.collabChangeSubject.next();
}
```

### 3.12 — Cursor tracking con Syncfusion

```typescript
private setupCursorTracking(): void {
  const containerEl = document.getElementById('organiflow-diagram');
  if (!containerEl) return;

  this.zone.runOutsideAngular(() => {
    fromEvent<MouseEvent>(containerEl, 'mousemove').pipe(
      throttleTime(80),
      takeUntil(this.destroy$),
    ).subscribe(event => {
      const rect = containerEl.getBoundingClientRect();
      const x    = event.clientX - rect.left;
      const y    = event.clientY - rect.top;
      this.collaborationService.sendCursor(this.workflowId(), x, y, null);
    });
  });
}
```

### 3.13 — ngAfterViewInit y ngOnDestroy

```typescript
ngAfterViewInit(): void {
  const populate = () => this.populateCanvas(this.workflow()!);
  if (this.workflow()) {
    populate();
  } else {
    this.pendingLoad = populate;
  }
  this.setupCursorTracking();
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.collaborationService.disconnect();
}
```

---

## Fase 4 — Symbol Palette

Con Syncfusion, el `ejs-symbol-palette` es un componente nativo — eliminar `symbol-palette.component` custom y reemplazarlo con el componente inline en el editor, o mantenerlo como wrapper mínimo:

```typescript
// symbol-palette.component.ts — se simplifica a solo pasar la configuración
@Component({
  selector: 'app-symbol-palette',
  imports: [SymbolPaletteModule],
  template: `
    <ejs-symbol-palette
      id="symbolpalette"
      [expandMode]="'Multiple'"
      [palettes]="palettes"
      [width]="'100%'"
      [height]="'100%'"
      [symbolHeight]="56"
      [symbolWidth]="56"
    ></ejs-symbol-palette>
  `,
})
export class SymbolPaletteComponent {
  readonly palettes = ORGANIFLOW_PALETTES; // Constante con los símbolos UML Activity
}
```

El `DiagramComponent` detecta automáticamente el `ejs-symbol-palette` por su `id="symbolpalette"` cuando el componente está en la misma página. No hace falta configuración adicional para el drag-and-drop.

---

## Fase 5 — Detectar uiSchema legado de JointJS

Los workflows que se guardaron con JointJS tienen `uiSchema` con clave `cells`:
```json
{ "cells": [...] }
```

Los workflows con Syncfusion tienen un formato diferente (objeto con `nodes`, `connectors`, etc.).

Guard en `populateCanvas`:

```typescript
private isJointJsSchema(uiSchema: string): boolean {
  try {
    const parsed = JSON.parse(uiSchema);
    return Array.isArray(parsed.cells);
  } catch {
    return false;
  }
}
```

Si se detecta formato JointJS → descartar `uiSchema` → regenerar desde `workflow.lanes` o departamentos (mismo flujo que workflow nuevo).

---

## Fase 6 — Verificación de colaboración

La colaboración no requiere cambios. Solo verificar:

| Aspecto | Estado |
|---|---|
| `collaboration.service.ts` | Sin cambios |
| `uiSchema` string | Sigue siendo string opaco para el backend |
| Tamaño del mensaje | ~20-33 KB con Syncfusion (dentro del límite de 512 KB configurado) |
| Echo filter (`isApplyingRemoteChange`) | Vuelve a 400 ms (sin el throttle de 600 ms de JointJS) |
| Sync al unirse | Funciona — `sendSyncToUser` ya fue corregido para usar `userId` como nombre del principal |

---

## Orden de implementación

```
Fase 0 — npm uninstall/install + angular.json + main.ts       (15 min)
Fase 1 — Limpiar archivos JointJS                              (10 min)
           └── Eliminar diagram.service.ts
           └── Eliminar jointjs-shapes.ts
Fase 2 — WorkflowMapper reescritura (toSyncfusion/fromSyncfusion)  (3 h)
Fase 3 — WorkflowEditorComponent reescritura                    (4 h)
           └── Template con <ejs-diagram>
           └── Eventos de cambio (callbacks en lugar de observables)
           └── applyRemoteChange con diagram.loadDiagram()
           └── saveGraph con diagram.saveDiagram()
Fase 4 — Symbol Palette simplificada                            (1 h)
Fase 5 — Guard de uiSchema legado JointJS                       (30 min)
Fase 6 — Test colaboración (2 usuarios, mismo workflow)         (1 h)
```

---

## Decisiones de diseño clave

### ¿Por qué UML Activity y no los shapes genéricos de Syncfusion?
El estándar UML Activity tiene formas con semántica clara (InitialNode, FinalNode, DecisionNode) que se alinean exactamente con los tipos de nodo de Organiflow. Los usuarios entienden visualmente el flujo sin necesidad de leyenda.

### ¿Por qué `addInfo` para la metadata?
Syncfusion provee `addInfo` en `NodeModel` y `ConnectorModel` como campo de metadata libre. Es el lugar correcto para guardar datos de Organiflow (`organiflowType`, `laneId`, `formSchema`, etc.) que no tienen equivalente en el modelo visual de Syncfusion. `addInfo` se serializa automáticamente en `diagram.saveDiagram()` y se restaura en `diagram.loadDiagram()`.

### ¿Se pierden los datos de los workflows guardados con JointJS?
No. El guard de `isJointJsSchema` detecta el formato JointJS y regenera el canvas desde `workflow.lanes` (que siempre se guarda en MongoDB via el endpoint HTTP, independientemente del canvas). Solo se pierde la posición visual de los nodos — el datos de negocio (nombre, formulario, roles asignados) se recupera de `workflow.nodes`.

### ¿Tamaño del uiSchema?
Syncfusion produce ~20-33 KB. El backend está configurado con límites de 512 KB. No hay riesgo de overflow.
