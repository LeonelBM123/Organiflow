# Organiflow — Graficador de Workflows
## Guía técnica de implementación frontend

**Framework:** Angular (latest)  
**Librería de diagramación:** Syncfusion Diagram — Community License  
**Base URL API:** `http://localhost:8080/api/v1`  
**Nota:** La autenticación JWT ya está configurada. Todos los requests incluyen la cookie `jwt_token` automáticamente vía el interceptor existente.

---

## Índice

1. [¿Qué es Syncfusion Diagram?](#1-qué-es-syncfusion-diagram)
2. [Instalación y configuración](#2-instalación-y-configuración)
3. [Conceptos clave de la librería](#3-conceptos-clave-de-la-librería)
4. [Endpoints del módulo Workflow](#4-endpoints-del-módulo-workflow)
5. [Estructura de carpetas del módulo](#5-estructura-de-carpetas-del-módulo)
6. [Modelos TypeScript](#6-modelos-typescript)
7. [Servicio de workflows](#7-servicio-de-workflows)
8. [Mapper Syncfusion ↔ API](#8-mapper-syncfusion--api)
9. [Componente del canvas — workflow-editor](#9-componente-del-canvas--workflow-editor)
10. [Panel lateral de propiedades del nodo](#10-panel-lateral-de-propiedades-del-nodo)
11. [Paleta de herramientas](#11-paleta-de-herramientas)
12. [Auto-save y flujo de guardado](#12-auto-save-y-flujo-de-guardado)
13. [Publicar un workflow](#13-publicar-un-workflow)
14. [Diseño visual — sistema de estilos](#14-diseño-visual--sistema-de-estilos)

---

## 1. ¿Qué es Syncfusion Diagram?

Syncfusion Diagram es una librería JavaScript/Angular para crear editores de diagramas interactivos. En Organiflow la usamos para construir el canvas donde los administradores diseñan los workflows de políticas de negocio.

### Conceptos fundamentales que usamos

**SwimLane** — es el contenedor principal del diagrama. Representa el workflow completo organizado en carriles horizontales (lanes). Cada lane corresponde a un actor del proceso (Cliente, Funcionario, Gerencia). En Syncfusion, el swimlane es técnicamente un nodo con `shape.type = 'SwimLane'`.

**Lane** — un carril dentro del swimlane. Cada lane tiene un color, un encabezado y contiene los nodos del actor responsable.

**Node** — un paso del proceso dentro de un lane. Puede ser START, TASK, CONDITION, MERGE, ITERATOR o END. En Syncfusion los nodos van como `children` del lane.

**Connector** — una flecha que conecta dos nodos. Los connectors son independientes del swimlane — viven en el nivel superior del diagrama.

**Port** — punto de conexión de un nodo. Los connectors se anclan a ports específicos (entrada/salida) para que las flechas queden bien posicionadas.

**addInfo** — propiedad especial de Syncfusion para guardar metadata custom en nodos y connectors. La usamos para persistir `type`, `formSchema`, `aiConfig`, `relationType` y `conditionRule` sin interferir con la renderización del diagrama.

### Ciclo de vida del diagrama

```
Cargar workflow desde API
         ↓
WorkflowMapper.toSyncfusion()   ← transforma al formato de Syncfusion
         ↓
DiagramComponent renderiza el canvas
         ↓
Admin edita (mueve nodos, agrega conexiones, configura propiedades)
         ↓
Eventos: collectionChange / positionChange / connectionChange
         ↓
debounceTime(2000ms)            ← espera 2s sin cambios
         ↓
WorkflowMapper.toApiRequest()   ← serializa el canvas al formato de la API
         ↓
PUT /workflows/{id}/graph       ← persiste en MongoDB
```

---

## 2. Instalación y configuración

### Instalar dependencias

```bash
npm install @syncfusion/ej2-angular-diagrams @syncfusion/ej2-base
```

### Registrar la licencia Community en `main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLicense } from '@syncfusion/ej2-base';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Obtener la clave en: https://www.syncfusion.com/products/communitylicense
registerLicense('TU_CLAVE_DE_LICENCIA_COMMUNITY');

bootstrapApplication(AppComponent, appConfig);
```

### Agregar estilos en `angular.json`

```json
"styles": [
  "node_modules/@syncfusion/ej2/material.css",
  "src/styles.scss"
]
```

### Importar el módulo en el módulo del graficador

```typescript
// workflows.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramModule, SymbolPaletteModule } from '@syncfusion/ej2-angular-diagrams';
import { WorkflowEditorComponent } from './workflow-editor/workflow-editor.component';
import { NodePanelComponent } from './workflow-editor/node-panel/node-panel.component';
import { ToolbarComponent } from './workflow-editor/toolbar/toolbar.component';

@NgModule({
  declarations: [
    WorkflowEditorComponent,
    NodePanelComponent,
    ToolbarComponent
  ],
  imports: [
    CommonModule,
    DiagramModule,      // el canvas principal
    SymbolPaletteModule // la paleta de herramientas lateral
  ]
})
export class WorkflowsModule {}
```

---

## 3. Conceptos clave de la librería

### Cómo funciona el SwimLane en Syncfusion

El swimlane se define como un único nodo con `shape.type = 'SwimLane'`. Los lanes y sus nodos hijos van todos dentro de ese objeto. Los connectors (flechas) van aparte en el array de connectors del diagrama.

```typescript
// Estructura del swimlane en Syncfusion
const swimlane: NodeModel = {
  id: 'swimlane-main',
  shape: {
    type: 'SwimLane',
    orientation: 'Horizontal',   // carriles horizontales
    header: {
      annotation: { content: 'Nombre del Workflow' },
      height: 50,
    },
    lanes: [
      {
        id: 'lane-user',
        height: 150,
        header: {
          annotation: { content: 'Cliente' },
          width: 60,
        },
        style: { fill: '#E1F5EE' },
        children: [
          // Aquí van los nodos que pertenecen a este lane
          {
            id: 'node-start',
            shape: { type: 'Flow', shape: 'Terminator' },
            annotations: [{ content: 'Inicio' }],
            offsetX: 100,
            offsetY: 75,
            width: 80,
            height: 40,
          }
        ]
      }
    ]
  }
};
```

### Cómo funciona addInfo

`addInfo` es un objeto libre que Syncfusion preserva en la serialización (`saveDiagram()` / `loadDiagram()`). Es el puente entre los datos de negocio de Organiflow y la representación visual del canvas.

```typescript
// En un nodo TASK
child.addInfo = {
  type: 'TASK',
  laneId: 'lane-officer',
  assignedRole: 'officer',
  timeoutHours: 24,
  formSchema: {
    name: 'Formulario de Revisión',
    fields: [...]
  },
  aiConfig: {
    prompt: 'Analiza el perfil crediticio...',
    model: 'gpt-4o',
    autoExecute: false
  }
};

// En un connector CONDITIONAL
connector.addInfo = {
  relationType: 'CONDITIONAL',
  conditionRule: {
    field: 'recomendacion',
    operator: '==',
    value: 'Aprobar'
  },
  priority: 1
};
```

### Serialización del diagrama

```typescript
// Guardar el estado completo del canvas a JSON
const json = diagram.saveDiagram();

// Cargar un JSON previamente guardado
diagram.loadDiagram(json);
```

> **Importante:** `saveDiagram()` devuelve un string JSON. Siempre parsearlo con `JSON.parse()` antes de procesarlo.

### Eventos que necesitamos escuchar

| Evento | Cuándo se dispara | Uso en Organiflow |
|--------|------------------|-------------------|
| `collectionChange` | Al agregar/eliminar nodos o connectors | Dispara auto-save |
| `positionChange` | Al mover un nodo | Dispara auto-save |
| `connectionChange` | Al crear/modificar una conexión | Dispara auto-save |
| `selectionChange` | Al seleccionar un elemento | Abre el panel de propiedades |
| `doubleClick` | Al hacer doble clic en un nodo | Abre el panel de propiedades |

---

## 4. Endpoints del módulo Workflow

### `POST /workflows`
Crea un workflow vacío. El grafo se llena después desde el canvas.

**Body:**
```json
{
  "name": "Solicitud de Crédito",
  "description": "Proceso de aprobación de créditos"
}
```

**Response `201`:**
```json
{
  "id": "655a000000000000000000c1",
  "name": "Solicitud de Crédito",
  "status": "DRAFT",
  "currentVersion": 0,
  "lanes": [],
  "nodes": [],
  "edges": []
}
```

---

### `GET /workflows`
Lista todos los workflows del tenant (resumen — sin el grafo). Usar en la pantalla de listado.

**Response `200`:**
```json
[
  {
    "id": "655a000000000000000000c1",
    "name": "Solicitud de Crédito",
    "status": "PUBLISHED",
    "currentVersion": 2,
    "totalNodes": 7,
    "totalLanes": 3,
    "createdAt": "2025-01-15T10:40:00",
    "updatedAt": "2025-01-16T09:00:00"
  }
]
```

---

### `GET /workflows/published`
Lista solo los workflows en estado `PUBLISHED`. Usar en la pantalla del usuario para iniciar ejecuciones.

---

### `GET /workflows/{id}`
Obtiene el workflow completo con el grafo. **Llamar al abrir el canvas.** Este es el payload que el mapper transforma al formato de Syncfusion.

**Response `200`:**
```json
{
  "id": "655a000000000000000000c1",
  "name": "Solicitud de Crédito",
  "status": "DRAFT",
  "currentVersion": 1,
  "lanes": [
    {
      "id": "lane-user",
      "name": "Cliente",
      "role": "user",
      "height": 150,
      "color": "#E1F5EE",
      "sortOrder": 1
    },
    {
      "id": "lane-officer",
      "name": "Analista de Crédito",
      "role": "officer",
      "height": 150,
      "color": "#E6F1FB",
      "sortOrder": 2
    }
  ],
  "nodes": [
    {
      "id": "node-start",
      "laneId": "lane-user",
      "name": "Inicio",
      "type": "START",
      "shape": { "type": "Flow", "shape": "Terminator" },
      "offsetX": 100.0,
      "offsetY": 75.0,
      "width": 80.0,
      "height": 40.0,
      "annotations": [{ "content": "Inicio" }],
      "ports": [
        { "id": "port-out", "offset": { "x": 1, "y": 0.5 }, "visibility": "Connect" }
      ],
      "assignedRole": "user",
      "timeoutHours": null,
      "formSchema": null,
      "aiConfig": null
    },
    {
      "id": "node-revision",
      "laneId": "lane-officer",
      "name": "Revisión de Solicitud",
      "type": "TASK",
      "shape": { "type": "Flow", "shape": "Process" },
      "offsetX": 300.0,
      "offsetY": 75.0,
      "width": 160.0,
      "height": 60.0,
      "annotations": [{ "content": "Revisión de Solicitud" }],
      "ports": [
        { "id": "port-in", "offset": { "x": 0, "y": 0.5 }, "visibility": "Connect" },
        { "id": "port-out", "offset": { "x": 1, "y": 0.5 }, "visibility": "Connect" }
      ],
      "assignedRole": "officer",
      "timeoutHours": 24,
      "formSchema": {
        "name": "Formulario de Revisión",
        "fields": [
          {
            "name": "monto_solicitado",
            "label": "Monto Solicitado ($)",
            "type": "number",
            "required": true,
            "options": [],
            "validationRules": { "min": 100, "max": 100000 },
            "visibilityConditions": {},
            "sortOrder": 1
          }
        ]
      },
      "aiConfig": {
        "prompt": "Analiza el perfil crediticio y sugiere una recomendación.",
        "model": "gpt-4o",
        "autoExecute": false
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "sourceId": "node-start",
      "targetId": "node-revision",
      "sourcePortId": "port-out",
      "targetPortId": "port-in",
      "relationType": "SEQUENTIAL",
      "label": "",
      "conditionRule": null,
      "priority": 1,
      "style": { "strokeColor": "#888780", "strokeWidth": 1.5 }
    }
  ]
}
```

---

### `PUT /workflows/{id}`
Actualiza nombre y descripción.

**Body:**
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción"
}
```

---

### `PUT /workflows/{id}/graph`
**El endpoint más crítico.** Guarda el grafo completo serializado desde Syncfusion. Se llama en cada auto-save. Reemplaza lanes, nodes y edges completamente — siempre enviar los tres juntos.

**Body:**
```json
{
  "lanes": [ ...array completo de WorkflowLane... ],
  "nodes": [ ...array completo de WorkflowNode... ],
  "edges": [ ...array completo de WorkflowEdge... ]
}
```

**Response `200`:** WorkflowResponse completo.

**Errores:**
| Código | Motivo |
|--------|--------|
| `400` | Workflow archivado — no editable |
| `404` | No encontrado o de otro tenant |

---

### `POST /workflows/{id}/publish`
Valida y publica el workflow. Crea un snapshot inmutable. Las ejecuciones futuras usan este snapshot.

**Validaciones del backend:**
- Debe tener al menos un nodo `START`
- Debe tener al menos un nodo `END`
- Debe tener al menos un edge

**Body:**
```json
{
  "changelog": "Se agregó aprobación gerencial para montos mayores a $50,000"
}
```

**Response `200`:** WorkflowResponse con `status: "PUBLISHED"` y `currentVersion` incrementado.

---

### `POST /workflows/{id}/draft`
Vuelve el workflow a `DRAFT` para edición. Las ejecuciones en curso no se afectan.

---

### `POST /workflows/{id}/archive`
Archiva el workflow. No se pueden iniciar nuevas ejecuciones.

---

### `DELETE /workflows/{id}`
Elimina un workflow. Solo funciona en estado `DRAFT`.

**Errores:**
| Código | Motivo |
|--------|--------|
| `400` | Workflow publicado — archivarlo primero |

---

### Formato de error estándar

Todos los errores devuelven:
```json
{
  "status": 400,
  "message": "El workflow debe tener al menos un nodo START",
  "timestamp": "2025-01-15T10:40:00"
}
```

---

## 5. Estructura de carpetas del módulo

```
src/app/modules/workflows/
  ├── workflows.module.ts
  ├── workflows-routing.module.ts
  │
  ├── workflow-list/
  │   ├── workflow-list.component.ts
  │   ├── workflow-list.component.html
  │   └── workflow-list.component.scss
  │
  ├── workflow-editor/
  │   ├── workflow-editor.component.ts       ← canvas principal
  │   ├── workflow-editor.component.html
  │   ├── workflow-editor.component.scss
  │   │
  │   ├── toolbar/
  │   │   ├── editor-toolbar.component.ts    ← barra superior
  │   │   ├── editor-toolbar.component.html
  │   │   └── editor-toolbar.component.scss
  │   │
  │   ├── node-panel/
  │   │   ├── node-panel.component.ts        ← propiedades del nodo
  │   │   ├── node-panel.component.html
  │   │   └── node-panel.component.scss
  │   │
  │   └── symbol-palette/
  │       ├── symbol-palette.component.ts    ← paleta de nodos
  │       ├── symbol-palette.component.html
  │       └── symbol-palette.component.scss
  │
  └── workflow-form/
      ├── workflow-form.component.ts         ← crear/editar nombre
      ├── workflow-form.component.html
      └── workflow-form.component.scss

src/app/core/
  ├── models/
  │   └── workflow.model.ts
  ├── services/
  │   └── workflow.service.ts
  └── mappers/
      └── workflow.mapper.ts
```

---

## 6. Modelos TypeScript

**`src/app/core/models/workflow.model.ts`**

```typescript
export type NodeType = 'START' | 'TASK' | 'CONDITION' | 'MERGE' | 'ITERATOR' | 'END';
export type EdgeType = 'SEQUENTIAL' | 'CONDITIONAL' | 'ITERATIVE' | 'MERGE';
export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'boolean' | 'textarea';
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';

export interface WorkflowLane {
  id: string;
  name: string;
  role: 'admin' | 'officer' | 'user';
  height: number;
  color: string;
  sortOrder: number;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  validationRules: Record<string, unknown>;
  visibilityConditions: Record<string, unknown>;
  sortOrder: number;
}

export interface FormSchema {
  name: string;
  fields: FormField[];
}

export interface AiConfig {
  prompt: string;
  model: string;
  autoExecute: boolean;
}

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface NodeStyle {
  type: string;
  shape: string;
}

export interface Port {
  id: string;
  offset: { x: number; y: number };
  visibility: string;
}

export interface WorkflowNode {
  id: string;
  laneId: string;
  name: string;
  type: NodeType;
  shape: NodeStyle;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  annotations: Array<{ content: string }>;
  ports: Port[];
  assignedRole?: string;
  assignedUserId?: string;
  timeoutHours?: number;
  formSchema?: FormSchema;
  aiConfig?: AiConfig;
}

export interface EdgeStyle {
  strokeColor: string;
  strokeWidth: number;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePortId?: string;
  targetPortId?: string;
  relationType: EdgeType;
  label: string;
  conditionRule?: ConditionRule;
  priority?: number;
  style?: EdgeStyle;
}

export interface WorkflowVersion {
  versionNumber: number;
  changelog: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentVersion: number;
  createdBy: string;
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  versions: WorkflowVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowSummaryResponse {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentVersion: number;
  totalNodes: number;
  totalLanes: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRequest {
  name: string;
  description?: string;
}

export interface WorkflowSaveRequest {
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowPublishRequest {
  changelog: string;
}
```

---

## 7. Servicio de workflows

**`src/app/core/services/workflow.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WorkflowResponse,
  WorkflowSummaryResponse,
  WorkflowRequest,
  WorkflowSaveRequest,
  WorkflowPublishRequest
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {

  private readonly base = '/api/v1/workflows';

  constructor(private http: HttpClient) {}

  findAll(): Observable<WorkflowSummaryResponse[]> {
    return this.http.get<WorkflowSummaryResponse[]>(this.base);
  }

  findPublished(): Observable<WorkflowSummaryResponse[]> {
    return this.http.get<WorkflowSummaryResponse[]>(`${this.base}/published`);
  }

  findById(id: string): Observable<WorkflowResponse> {
    return this.http.get<WorkflowResponse>(`${this.base}/${id}`);
  }

  create(request: WorkflowRequest): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(this.base, request);
  }

  update(id: string, request: WorkflowRequest): Observable<WorkflowResponse> {
    return this.http.put<WorkflowResponse>(`${this.base}/${id}`, request);
  }

  saveGraph(id: string, request: WorkflowSaveRequest): Observable<WorkflowResponse> {
    return this.http.put<WorkflowResponse>(`${this.base}/${id}/graph`, request);
  }

  publish(id: string, request: WorkflowPublishRequest): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/publish`, request);
  }

  revertToDraft(id: string): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/draft`, {});
  }

  archive(id: string): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/archive`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

---

## 8. Mapper Syncfusion ↔ API

Este es el archivo más crítico del módulo. Traduce entre el formato de la API de Organiflow y el formato interno de Syncfusion.

**`src/app/core/mappers/workflow.mapper.ts`**

```typescript
import {
  NodeModel, ConnectorModel, LaneModel, ChildContainerModel
} from '@syncfusion/ej2-angular-diagrams';
import {
  WorkflowResponse, WorkflowSaveRequest,
  WorkflowNode, WorkflowEdge, WorkflowLane
} from '../models/workflow.model';

export class WorkflowMapper {

  /**
   * API → Syncfusion
   * Transforma el workflow de la API al formato que necesita el DiagramComponent.
   * Llamar al abrir el canvas con los datos del GET /workflows/{id}
   */
  static toSyncfusion(workflow: WorkflowResponse): {
    nodes: NodeModel[];
    connectors: ConnectorModel[];
  } {
    const swimlane: NodeModel = {
      id: 'swimlane-main',
      shape: {
        type: 'SwimLane',
        orientation: 'Horizontal',
        header: {
          annotation: { content: workflow.name },
          height: 50,
          style: { fontSize: 14, bold: true, fill: '#1a1a2e', color: '#ffffff' }
        },
        lanes: workflow.lanes
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(lane => WorkflowMapper.laneToSyncfusion(lane, workflow.nodes))
      } as any,
      offsetX: 500,
      offsetY: 400,
    };

    const connectors: ConnectorModel[] = workflow.edges.map(edge =>
      WorkflowMapper.edgeToSyncfusion(edge)
    );

    return { nodes: [swimlane], connectors };
  }

  /**
   * Lane API → Lane Syncfusion con sus nodos hijos
   */
  private static laneToSyncfusion(
    lane: WorkflowLane,
    allNodes: WorkflowNode[]
  ): LaneModel {
    const laneNodes = allNodes.filter(n => n.laneId === lane.id);

    return {
      id: lane.id,
      height: lane.height || 150,
      header: {
        annotation: { content: lane.name },
        width: 60,
        style: { fontSize: 12, bold: false }
      },
      style: { fill: lane.color || '#f8f9fa', strokeColor: '#dee2e6' },
      children: laneNodes.map(n => WorkflowMapper.nodeToSyncfusion(n))
    } as LaneModel;
  }

  /**
   * Nodo API → Nodo Syncfusion (como child del lane)
   */
  private static nodeToSyncfusion(node: WorkflowNode): ChildContainerModel {
    return {
      id: node.id,
      shape: node.shape as any,
      width: node.width || 120,
      height: node.height || 50,
      annotations: node.annotations?.length
        ? node.annotations
        : [{ content: node.name, style: { fontSize: 11 } }],
      ports: node.ports || [],
      offsetX: node.offsetX,
      offsetY: node.offsetY,
      style: WorkflowMapper.getNodeStyle(node.type),
      // addInfo guarda toda la metadata de negocio
      addInfo: {
        type: node.type,
        laneId: node.laneId,
        assignedRole: node.assignedRole,
        assignedUserId: node.assignedUserId,
        timeoutHours: node.timeoutHours,
        formSchema: node.formSchema,
        aiConfig: node.aiConfig
      }
    } as any;
  }

  /**
   * Edge API → Connector Syncfusion
   */
  private static edgeToSyncfusion(edge: WorkflowEdge): ConnectorModel {
    return {
      id: edge.id,
      sourceID: edge.sourceId,
      targetID: edge.targetId,
      sourcePortID: edge.sourcePortId || '',
      targetPortID: edge.targetPortId || '',
      annotations: edge.label
        ? [{ content: edge.label, style: { fontSize: 10 } }]
        : [],
      style: {
        strokeColor: edge.style?.strokeColor || '#6c757d',
        strokeWidth: edge.style?.strokeWidth || 1.5
      },
      targetDecorator: { style: { fill: edge.style?.strokeColor || '#6c757d' } },
      addInfo: {
        relationType: edge.relationType,
        conditionRule: edge.conditionRule,
        priority: edge.priority || 1
      }
    };
  }

  /**
   * Sincronizar → API
   * Serializa el DiagramComponent al formato que necesita PUT /workflows/{id}/graph
   * Llamar con la instancia del DiagramComponent.
   */
  static toApiRequest(diagram: any): WorkflowSaveRequest {
    const serialized = JSON.parse(diagram.saveDiagram());

    // El swimlane es el único nodo raíz con type SwimLane
    const swimlane = serialized.nodes?.find(
      (n: any) => n.shape?.type === 'SwimLane'
    );

    if (!swimlane) {
      return { lanes: [], nodes: [], edges: [] };
    }

    // Extraer lanes
    const lanes: WorkflowLane[] = (swimlane.shape?.lanes || []).map(
      (lane: any, index: number) => ({
        id: lane.id,
        name: lane.header?.annotation?.content || lane.id,
        role: lane.addInfo?.role || 'officer',
        height: lane.height || 150,
        color: lane.style?.fill || '#f8f9fa',
        sortOrder: index + 1
      })
    );

    // Extraer nodos de los children de cada lane
    const nodes: WorkflowNode[] = [];
    (swimlane.shape?.lanes || []).forEach((lane: any) => {
      (lane.children || []).forEach((child: any) => {
        nodes.push({
          id: child.id,
          laneId: lane.id,
          name: child.annotations?.[0]?.content || child.id,
          type: child.addInfo?.type || 'TASK',
          shape: child.shape,
          offsetX: child.offsetX || 0,
          offsetY: child.offsetY || 0,
          width: child.width || 120,
          height: child.height || 50,
          annotations: child.annotations || [],
          ports: child.ports || [],
          assignedRole: child.addInfo?.assignedRole,
          assignedUserId: child.addInfo?.assignedUserId,
          timeoutHours: child.addInfo?.timeoutHours,
          formSchema: child.addInfo?.formSchema,
          aiConfig: child.addInfo?.aiConfig
        });
      });
    });

    // Extraer edges de los connectors
    const edges: WorkflowEdge[] = (serialized.connectors || []).map(
      (conn: any) => ({
        id: conn.id,
        sourceId: conn.sourceID,
        targetId: conn.targetID,
        sourcePortId: conn.sourcePortID || undefined,
        targetPortId: conn.targetPortID || undefined,
        relationType: conn.addInfo?.relationType || 'SEQUENTIAL',
        label: conn.annotations?.[0]?.content || '',
        conditionRule: conn.addInfo?.conditionRule,
        priority: conn.addInfo?.priority || 1,
        style: {
          strokeColor: conn.style?.strokeColor || '#6c757d',
          strokeWidth: conn.style?.strokeWidth || 1.5
        }
      })
    );

    return { lanes, nodes, edges };
  }

  /**
   * Estilos visuales por tipo de nodo — paleta de Organiflow
   */
  static getNodeStyle(type: string): Record<string, string> {
    const styles: Record<string, Record<string, string>> = {
      START:     { fill: '#0f6e56', strokeColor: '#085041', color: '#ffffff' },
      END:       { fill: '#712b13', strokeColor: '#4a1b0c', color: '#ffffff' },
      TASK:      { fill: '#0c447c', strokeColor: '#042c53', color: '#ffffff' },
      CONDITION: { fill: '#633806', strokeColor: '#412402', color: '#ffffff' },
      MERGE:     { fill: '#3c3489', strokeColor: '#26215c', color: '#ffffff' },
      ITERATOR:  { fill: '#444441', strokeColor: '#2c2c2a', color: '#ffffff' },
    };
    return styles[type] || styles['TASK'];
  }
}
```

---

## 9. Componente del canvas — workflow-editor

### `workflow-editor.component.ts`

```typescript
import {
  Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DiagramComponent,
  NodeModel,
  ConnectorModel,
  DiagramTools,
  SnapSettingsModel,
  SnapConstraints,
  SelectorConstraints
} from '@syncfusion/ej2-angular-diagrams';
import { Subject, debounceTime, takeUntil, finalize } from 'rxjs';
import { WorkflowService } from '../../../core/services/workflow.service';
import { WorkflowMapper } from '../../../core/mappers/workflow.mapper';
import { WorkflowResponse, WorkflowNode } from '../../../core/models/workflow.model';

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})
export class WorkflowEditorComponent implements OnInit, OnDestroy {

  @ViewChild('diagram') diagram!: DiagramComponent;

  workflowId!: string;
  workflow: WorkflowResponse | null = null;

  // Datos que Syncfusion consume directamente
  diagramNodes: NodeModel[] = [];
  diagramConnectors: ConnectorModel[] = [];

  // Estado UI
  selectedNode: WorkflowNode | null = null;
  isLoading = true;
  isSaving = false;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error' = 'saved';

  // Auto-save — emite en cada cambio, guarda tras 2s de inactividad
  private readonly saveSubject = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  // Configuración del canvas
  readonly tool = DiagramTools.Default;

  readonly snapSettings: SnapSettingsModel = {
    constraints: SnapConstraints.ShowLines | SnapConstraints.SnapToLines,
    gridType: 'Lines',
    horizontalGridLines: { lineIntervals: [1, 9], lineColor: '#e9ecef' },
    verticalGridLines: { lineIntervals: [1, 9], lineColor: '#e9ecef' }
  };

  readonly selectorSettings = {
    constraints: SelectorConstraints.All
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.workflowId = this.route.snapshot.params['id'];
    this.loadWorkflow();

    // Auto-save con debounce de 2 segundos
    this.saveSubject.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveGraph());
  }

  // ── Carga ───────────────────────────────────────────────────

  loadWorkflow(): void {
    this.isLoading = true;
    this.workflowService.findById(this.workflowId).pipe(
      finalize(() => { this.isLoading = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        const { nodes, connectors } = WorkflowMapper.toSyncfusion(workflow);
        this.diagramNodes = nodes;
        this.diagramConnectors = connectors;
      },
      error: () => this.router.navigate(['/workflows'])
    });
  }

  // ── Guardado ────────────────────────────────────────────────

  saveGraph(): void {
    if (!this.diagram || this.isSaving) return;
    if (this.workflow?.status === 'ARCHIVED') return;

    this.isSaving = true;
    this.saveStatus = 'saving';

    const request = WorkflowMapper.toApiRequest(this.diagram);

    this.workflowService.saveGraph(this.workflowId, request).pipe(
      finalize(() => { this.isSaving = false; })
    ).subscribe({
      next: (workflow) => {
        this.workflow = workflow;
        this.saveStatus = 'saved';
      },
      error: () => { this.saveStatus = 'error'; }
    });
  }

  // ── Publicación ─────────────────────────────────────────────

  openPublishDialog(): void {
    // Reemplazar con un dialog component propio en producción
    const changelog = prompt('¿Qué cambios incluye esta versión?');
    if (changelog === null) return;

    this.workflowService.publish(this.workflowId, { changelog }).subscribe({
      next: (workflow) => { this.workflow = workflow; },
      error: (err) => alert(err.error?.message || 'Error al publicar')
    });
  }

  revertToDraft(): void {
    this.workflowService.revertToDraft(this.workflowId).subscribe({
      next: (workflow) => { this.workflow = workflow; }
    });
  }

  // ── Eventos del canvas ──────────────────────────────────────

  // Agrega/elimina nodo o connector → dispara auto-save
  onCollectionChange(event: any): void {
    this.saveStatus = 'unsaved';
    this.saveSubject.next();
  }

  // Mueve un nodo → dispara auto-save
  onPositionChange(event: any): void {
    this.saveStatus = 'unsaved';
    this.saveSubject.next();
  }

  // Crea o modifica una conexión → dispara auto-save
  onConnectionChange(event: any): void {
    this.saveStatus = 'unsaved';
    this.saveSubject.next();
  }

  // Selecciona un elemento → abre el panel de propiedades
  onSelectionChange(event: any): void {
    const selected = event.newValue?.[0];
    if (!selected || selected.shape?.type === 'SwimLane') {
      this.selectedNode = null;
      return;
    }

    // Buscar el nodo en el estado actual del workflow
    const nodeId = selected.id;
    const nodeData = this.workflow?.nodes.find(n => n.id === nodeId);
    this.selectedNode = nodeData || null;
  }

  // Doble clic → abre el panel de propiedades
  onDoubleClick(event: any): void {
    const element = event.source?.wrapper;
    if (!element) return;

    const nodeId = element.id;
    const nodeData = this.workflow?.nodes.find(n => n.id === nodeId);
    if (nodeData) this.selectedNode = nodeData;
  }

  // ── Propiedades del nodo ────────────────────────────────────

  onNodePropertiesSaved(updatedNode: WorkflowNode): void {
    if (!this.workflow) return;

    // Actualizar el nodo en el estado local
    this.workflow.nodes = this.workflow.nodes.map(n =>
      n.id === updatedNode.id ? updatedNode : n
    );

    // Actualizar el addInfo en el diagrama
    const diagramNode = this.diagram.getNodeObject(updatedNode.id);
    if (diagramNode) {
      this.diagram.updateNode(updatedNode.id, {
        addInfo: {
          type: updatedNode.type,
          laneId: updatedNode.laneId,
          assignedRole: updatedNode.assignedRole,
          timeoutHours: updatedNode.timeoutHours,
          formSchema: updatedNode.formSchema,
          aiConfig: updatedNode.aiConfig
        },
        annotations: [{ content: updatedNode.name }]
      });
    }

    this.selectedNode = null;
    this.saveSubject.next(); // auto-save tras actualizar propiedades
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### `workflow-editor.component.html`

```html
<div class="editor-root">

  <!-- Toolbar superior -->
  <app-editor-toolbar
    [workflow]="workflow"
    [saveStatus]="saveStatus"
    (saveClick)="saveGraph()"
    (publishClick)="openPublishDialog()"
    (draftClick)="revertToDraft()"
  ></app-editor-toolbar>

  <div class="editor-body">

    <!-- Paleta de herramientas lateral izquierda -->
    <app-symbol-palette></app-symbol-palette>

    <!-- Canvas principal -->
    <div class="canvas-wrapper" [class.loading]="isLoading">

      <div *ngIf="isLoading" class="canvas-loading">
        <div class="spinner"></div>
        <span>Cargando diagrama...</span>
      </div>

      <ejs-diagram
        #diagram
        id="organiflow-diagram"
        width="100%"
        height="100%"
        [nodes]="diagramNodes"
        [connectors]="diagramConnectors"
        [tool]="tool"
        [snapSettings]="snapSettings"
        [selectedItems]="selectorSettings"
        (collectionChange)="onCollectionChange($event)"
        (positionChange)="onPositionChange($event)"
        (connectionChange)="onConnectionChange($event)"
        (selectionChange)="onSelectionChange($event)"
        (doubleClick)="onDoubleClick($event)"
      ></ejs-diagram>
    </div>

    <!-- Panel lateral derecho — propiedades del nodo seleccionado -->
    <app-node-panel
      *ngIf="selectedNode"
      [node]="selectedNode"
      (save)="onNodePropertiesSaved($event)"
      (close)="selectedNode = null"
    ></app-node-panel>

  </div>
</div>
```

### `workflow-editor.component.scss`

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0d0d1a;
  font-family: 'DM Sans', sans-serif;
}

.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(15, 110, 86, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(12, 68, 124, 0.06) 0%, transparent 60%),
    #0d0d1a;

  &.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.canvas-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1d9e75;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Override de estilos de Syncfusion para adaptarlos al tema dark de Organiflow
::ng-deep {
  .e-diagram {
    background: transparent !important;
  }

  .e-diagram-background {
    fill: transparent !important;
  }

  // Swimlane header
  .e-swimlane-header rect {
    fill: #1a1a2e !important;
  }

  .e-swimlane-header text {
    fill: #ffffff !important;
  }
}
```

---

## 10. Panel lateral de propiedades del nodo

### `node-panel.component.ts`

```typescript
import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { WorkflowNode, NodeType, FormField, FieldType } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-node-panel',
  templateUrl: './node-panel.component.html',
  styleUrls: ['./node-panel.component.scss']
})
export class NodePanelComponent implements OnChanges {

  @Input() node!: WorkflowNode;
  @Output() save = new EventEmitter<WorkflowNode>();
  @Output() close = new EventEmitter<void>();

  form!: FormGroup;

  readonly fieldTypes: FieldType[] = [
    'text', 'number', 'select', 'multiselect',
    'date', 'file', 'boolean', 'textarea'
  ];

  readonly operators = ['==', '!=', '>', '<', '>=', '<=', 'contains'];

  readonly nodeTypeLabels: Record<NodeType, string> = {
    START: 'Inicio',
    END: 'Fin',
    TASK: 'Tarea',
    CONDITION: 'Condición',
    MERGE: 'Unión',
    ITERATOR: 'Iterador'
  };

  get isTask(): boolean {
    return this.node?.type === 'TASK' || this.node?.type === 'ITERATOR';
  }

  get fields(): FormArray {
    return this.form.get('fields') as FormArray;
  }

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['node'] && this.node) {
      this.buildForm();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      name: [this.node.name, Validators.required],
      assignedRole: [this.node.assignedRole || 'officer'],
      timeoutHours: [this.node.timeoutHours],
      formSchemaName: [this.node.formSchema?.name || ''],
      fields: this.fb.array(
        (this.node.formSchema?.fields || []).map(f => this.buildFieldGroup(f))
      ),
      // IA
      aiPrompt: [this.node.aiConfig?.prompt || ''],
      aiModel: [this.node.aiConfig?.model || 'gpt-4o'],
      aiAutoExecute: [this.node.aiConfig?.autoExecute || false]
    });
  }

  buildFieldGroup(field: Partial<FormField> = {}): FormGroup {
    return this.fb.group({
      name: [field.name || '', Validators.required],
      label: [field.label || '', Validators.required],
      type: [field.type || 'text'],
      required: [field.required ?? false],
      options: [field.options?.join(', ') || ''],
      sortOrder: [field.sortOrder || 0]
    });
  }

  addField(): void {
    this.fields.push(this.buildFieldGroup());
  }

  removeField(index: number): void {
    this.fields.removeAt(index);
  }

  onSave(): void {
    if (this.form.invalid) return;

    const v = this.form.value;

    const updatedNode: WorkflowNode = {
      ...this.node,
      name: v.name,
      assignedRole: v.assignedRole,
      timeoutHours: v.timeoutHours || undefined,
      formSchema: this.isTask ? {
        name: v.formSchemaName || `Formulario — ${v.name}`,
        fields: v.fields.map((f: any, index: number) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options ? f.options.split(',').map((o: string) => o.trim()) : [],
          validationRules: {},
          visibilityConditions: {},
          sortOrder: index + 1
        }))
      } : undefined,
      aiConfig: v.aiPrompt ? {
        prompt: v.aiPrompt,
        model: v.aiModel,
        autoExecute: v.aiAutoExecute
      } : undefined
    };

    this.save.emit(updatedNode);
  }
}
```

### `node-panel.component.html`

```html
<aside class="node-panel">

  <div class="panel-header">
    <div class="panel-title-group">
      <span class="node-type-badge" [attr.data-type]="node.type">
        {{ nodeTypeLabels[node.type] }}
      </span>
      <h3 class="panel-title">Propiedades</h3>
    </div>
    <button class="close-btn" (click)="close.emit()" aria-label="Cerrar panel">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <form [formGroup]="form" (ngSubmit)="onSave()" class="panel-form">

    <!-- Nombre del nodo -->
    <div class="field-group">
      <label class="field-label">Nombre del paso</label>
      <input
        class="field-input"
        formControlName="name"
        placeholder="Ej: Revisión de Solicitud"
      />
    </div>

    <!-- Rol responsable -->
    <div class="field-group">
      <label class="field-label">Rol responsable</label>
      <select class="field-select" formControlName="assignedRole">
        <option value="user">Cliente (usuario)</option>
        <option value="officer">Funcionario</option>
        <option value="admin">Administrador</option>
      </select>
    </div>

    <!-- Timeout (solo TASK) -->
    <div class="field-group" *ngIf="isTask">
      <label class="field-label">Tiempo límite (horas)</label>
      <input
        class="field-input"
        type="number"
        formControlName="timeoutHours"
        placeholder="Sin límite"
        min="1"
      />
      <span class="field-hint">
        Si el funcionario no completa la tarea en este tiempo, se escala automáticamente
      </span>
    </div>

    <!-- Formulario dinámico (solo TASK / ITERATOR) -->
    <ng-container *ngIf="isTask">
      <div class="section-divider">
        <span>Formulario del paso</span>
      </div>

      <div class="field-group">
        <label class="field-label">Nombre del formulario</label>
        <input
          class="field-input"
          formControlName="formSchemaName"
          placeholder="Ej: Formulario de Revisión"
        />
      </div>

      <!-- Campos del formulario -->
      <div class="fields-list" formArrayName="fields">
        <div
          *ngFor="let field of fields.controls; let i = index"
          [formGroupName]="i"
          class="field-card"
        >
          <div class="field-card-header">
            <span class="field-number">Campo {{ i + 1 }}</span>
            <button
              type="button"
              class="remove-btn"
              (click)="removeField(i)"
              aria-label="Eliminar campo"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="field-row">
            <div class="field-group flex-1">
              <label class="field-label">Nombre interno</label>
              <input class="field-input" formControlName="name" placeholder="monto_solicitado" />
            </div>
            <div class="field-group flex-1">
              <label class="field-label">Etiqueta visible</label>
              <input class="field-input" formControlName="label" placeholder="Monto Solicitado" />
            </div>
          </div>

          <div class="field-row">
            <div class="field-group flex-1">
              <label class="field-label">Tipo</label>
              <select class="field-select" formControlName="type">
                <option *ngFor="let t of fieldTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="field-group field-required">
              <label class="field-label">Requerido</label>
              <label class="toggle">
                <input type="checkbox" formControlName="required" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>

          <!-- Opciones (solo select/multiselect) -->
          <div
            class="field-group"
            *ngIf="field.get('type')?.value === 'select' || field.get('type')?.value === 'multiselect'"
          >
            <label class="field-label">Opciones (separadas por coma)</label>
            <input
              class="field-input"
              formControlName="options"
              placeholder="Aprobar, Rechazar, Revisar"
            />
          </div>
        </div>

        <button type="button" class="add-field-btn" (click)="addField()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Agregar campo
        </button>
      </div>

      <!-- Configuración de IA -->
      <div class="section-divider">
        <span>Asistencia de IA</span>
      </div>

      <div class="field-group">
        <label class="field-label">Prompt de IA</label>
        <textarea
          class="field-textarea"
          formControlName="aiPrompt"
          placeholder="Ej: Analiza el perfil crediticio y sugiere una recomendación basada en el score..."
          rows="3"
        ></textarea>
        <span class="field-hint">
          La IA puede leer todo el contexto del proceso al generar la sugerencia
        </span>
      </div>

      <div class="field-row">
        <div class="field-group flex-1">
          <label class="field-label">Modelo</label>
          <select class="field-select" formControlName="aiModel">
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-sonnet-4-6">Claude Sonnet</option>
          </select>
        </div>
        <div class="field-group field-required">
          <label class="field-label">Auto-ejecutar</label>
          <label class="toggle">
            <input type="checkbox" formControlName="aiAutoExecute" />
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>
    </ng-container>

    <!-- Acciones -->
    <div class="panel-actions">
      <button type="button" class="btn-secondary" (click)="close.emit()">
        Cancelar
      </button>
      <button type="submit" class="btn-primary" [disabled]="form.invalid">
        Guardar cambios
      </button>
    </div>

  </form>

</aside>
```

### `node-panel.component.scss`

```scss
.node-panel {
  width: 360px;
  min-width: 360px;
  height: 100%;
  background: #12121f;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'DM Sans', sans-serif;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.node-type-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;

  &[data-type="START"]     { background: rgba(15, 110, 86, 0.3); color: #5dcaa5; }
  &[data-type="END"]       { background: rgba(113, 43, 19, 0.3); color: #f09975; }
  &[data-type="TASK"]      { background: rgba(12, 68, 124, 0.3); color: #85b7eb; }
  &[data-type="CONDITION"] { background: rgba(99, 56, 6, 0.3);   color: #fac775; }
  &[data-type="MERGE"]     { background: rgba(60, 52, 137, 0.3); color: #afa9ec; }
  &[data-type="ITERATOR"]  { background: rgba(68, 68, 65, 0.3);  color: #b4b2a9; }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
}

.panel-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.flex-1 { flex: 1; }
  &.field-required { width: 90px; flex-shrink: 0; }
}

.field-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.field-input,
.field-select,
.field-textarea {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-family: inherit;
  padding: 9px 12px;
  width: 100%;
  transition: border-color 0.15s;
  outline: none;
  box-sizing: border-box;

  &::placeholder { color: rgba(255, 255, 255, 0.2); }

  &:focus {
    border-color: rgba(29, 158, 117, 0.5);
    background: rgba(255, 255, 255, 0.06);
  }
}

.field-select { cursor: pointer; }
.field-textarea { resize: vertical; min-height: 72px; }

.field-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1.4;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0;

  span {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
  }
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-number {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(226, 75, 74, 0.1);
  border-radius: 5px;
  color: rgba(226, 75, 74, 0.7);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(226, 75, 74, 0.2);
    color: #e24b4a;
  }
}

.add-field-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px dashed rgba(29, 158, 117, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(29, 158, 117, 0.7);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: rgba(29, 158, 117, 0.6);
    color: #1d9e75;
    background: rgba(29, 158, 117, 0.05);
  }
}

.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;

  input { opacity: 0; width: 0; height: 0; }

  .toggle-track {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;

    &::after {
      content: '';
      position: absolute;
      left: 2px;
      top: 2px;
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      transition: transform 0.2s;
    }
  }

  input:checked + .toggle-track {
    background: #1d9e75;
    &::after { transform: translateX(16px); background: #fff; }
  }
}

.panel-actions {
  display: flex;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: 4px;
}

.btn-primary {
  flex: 1;
  padding: 10px;
  background: #1d9e75;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) { background: #0f6e56; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.btn-secondary {
  flex: 1;
  padding: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }
}
```

---

## 11. Paleta de herramientas

### `symbol-palette.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import {
  SymbolPaletteComponent,
  PaletteModel,
  NodeModel
} from '@syncfusion/ej2-angular-diagrams';
import { WorkflowMapper } from '../../../../core/mappers/workflow.mapper';

@Component({
  selector: 'app-symbol-palette',
  templateUrl: './symbol-palette.component.html',
  styleUrls: ['./symbol-palette.component.scss']
})
export class SymbolPaletteComponent implements OnInit {

  palettes: PaletteModel[] = [];

  // Dimensiones de los símbolos en la paleta
  readonly symbolHeight = 48;
  readonly symbolWidth = 48;
  readonly symbolMargin = { left: 12, right: 12, top: 12, bottom: 12 };

  ngOnInit(): void {
    this.palettes = [
      {
        id: 'flow-nodes',
        title: 'Pasos del proceso',
        expanded: true,
        symbols: this.buildFlowNodes()
      }
    ];
  }

  private buildFlowNodes(): NodeModel[] {
    const nodeTypes = [
      { id: 'sym-start',     type: 'START',     label: 'Inicio',      shape: 'Terminator' },
      { id: 'sym-task',      type: 'TASK',       label: 'Tarea',       shape: 'Process' },
      { id: 'sym-condition', type: 'CONDITION',  label: 'Condición',   shape: 'Decision' },
      { id: 'sym-merge',     type: 'MERGE',      label: 'Unión',       shape: 'Process' },
      { id: 'sym-iterator',  type: 'ITERATOR',   label: 'Iterador',    shape: 'Process' },
      { id: 'sym-end',       type: 'END',        label: 'Fin',         shape: 'Terminator' },
    ];

    return nodeTypes.map(({ id, type, label, shape }) => ({
      id,
      shape: { type: 'Flow', shape },
      style: WorkflowMapper.getNodeStyle(type),
      annotations: [{ content: label, style: { fontSize: 10, color: '#fff' } }],
      addInfo: { type }
    }));
  }
}
```

### `symbol-palette.component.html`

```html
<aside class="palette-sidebar">
  <div class="palette-header">
    <span class="palette-title">Elementos</span>
  </div>

  <ejs-symbolpalette
    id="organiflow-palette"
    [width]="'100%'"
    [height]="'100%'"
    [palettes]="palettes"
    [symbolHeight]="symbolHeight"
    [symbolWidth]="symbolWidth"
    [symbolMargin]="symbolMargin"
    [getSymbolInfo]="getSymbolInfo"
  ></ejs-symbolpalette>
</aside>
```

---

## 12. Auto-save y flujo de guardado

El auto-save funciona con `debounceTime(2000)` — espera 2 segundos de inactividad antes de guardar. Nunca llama a la API en cada pixel que el admin mueve un nodo.

```
Admin edita el canvas
         ↓
Evento: collectionChange / positionChange / connectionChange
         ↓
saveStatus = 'unsaved'   ← el toolbar muestra "Sin guardar"
saveSubject.next()
         ↓
debounceTime(2000ms)     ← espera 2s sin más cambios
         ↓
saveStatus = 'saving'    ← el toolbar muestra "Guardando..."
WorkflowMapper.toApiRequest(diagram)
         ↓
PUT /api/v1/workflows/{id}/graph
         ↓
saveStatus = 'saved'     ← el toolbar muestra "Guardado"
```

**El toolbar muestra el estado en tiempo real:**

```typescript
// editor-toolbar.component.ts

@Input() saveStatus!: 'saved' | 'saving' | 'unsaved' | 'error';

get saveLabel(): string {
  const labels = {
    saved:   'Guardado',
    saving:  'Guardando...',
    unsaved: 'Sin guardar',
    error:   'Error al guardar'
  };
  return labels[this.saveStatus];
}
```

---

## 13. Publicar un workflow

```
Admin hace clic en "Publicar"
         ↓
Frontend muestra un dialog con campo "changelog"
         ↓
POST /api/v1/workflows/{id}/publish { changelog: "..." }
         ↓
Backend valida: START ✓ END ✓ edges ✓
         ↓
Backend crea snapshot en versions[]
status → PUBLISHED, currentVersion++
         ↓
Response: workflow actualizado
         ↓
Frontend actualiza el badge de estado
Los botones de edición se deshabilitan
         ↓
Para volver a editar: POST /workflows/{id}/draft
```

**Reglas de negocio que el frontend debe reflejar:**

| Estado | Puede editar canvas | Puede publicar | Puede archivar | Puede eliminar |
|--------|--------------------|--------------|--------------|--------------:|
| DRAFT | ✓ | ✓ | ✓ | ✓ |
| PUBLISHED | ✗ | ✗ | ✓ | ✗ |
| ARCHIVED | ✗ | ✗ | ✗ | ✗ |

---

## 14. Diseño visual — sistema de estilos

Organiflow usa un tema **dark industrial** con acentos teal y azul profundo. Toda la UI del editor debe respetar este sistema.

### Variables CSS globales — agregar en `styles.scss`

```scss
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  // Fondos
  --bg-root:      #0d0d1a;
  --bg-surface:   #12121f;
  --bg-elevated:  #1a1a2e;
  --bg-hover:     rgba(255, 255, 255, 0.04);
  --bg-active:    rgba(255, 255, 255, 0.08);

  // Bordes
  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong:  rgba(255, 255, 255, 0.18);

  // Tipografía
  --text-primary:   rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.55);
  --text-tertiary:  rgba(255, 255, 255, 0.30);

  // Colores de acento
  --accent-teal:    #1d9e75;
  --accent-teal-dk: #0f6e56;
  --accent-blue:    #378add;
  --accent-blue-dk: #0c447c;
  --accent-danger:  #e24b4a;
  --accent-warning: #ef9f27;

  // Colores de nodos
  --node-start:     #0f6e56;
  --node-end:       #712b13;
  --node-task:      #0c447c;
  --node-condition: #633806;
  --node-merge:     #3c3489;
  --node-iterator:  #444441;

  // Tipografía
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;

  // Espaciado
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Colores por tipo de nodo

| Tipo | Fondo | Color de texto |
|------|-------|---------------|
| START | `#0f6e56` | `#ffffff` |
| END | `#712b13` | `#ffffff` |
| TASK | `#0c447c` | `#ffffff` |
| CONDITION | `#633806` | `#ffffff` |
| MERGE | `#3c3489` | `#ffffff` |
| ITERATOR | `#444441` | `#ffffff` |

### Colores por tipo de edge

| Tipo de relación | Color de la flecha |
|------------------|--------------------|
| SEQUENTIAL | `#6c757d` |
| CONDITIONAL (aprobado) | `#1d9e75` |
| CONDITIONAL (rechazado) | `#e24b4a` |
| ITERATIVE | `#ef9f27` |
| MERGE | `#7f77dd` |

---

*Organiflow Frontend Docs — v1.0*  
*Angular + Syncfusion Diagram Community License*
