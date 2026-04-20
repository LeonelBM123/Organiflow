# Colaboración en Tiempo Real — Guía de Integración Frontend

> Documento dirigido al equipo Angular. Describe el protocolo completo para implementar la colaboración multi-usuario en el editor de workflows (Syncfusion Diagram).

---

## Sección 1 — Conexión WebSocket

### URL de conexión

```
http://localhost:8080/ws
```

El endpoint usa **SockJS** como fallback. En producción reemplazar el host según el entorno.

### Autenticación

El JWT **no** va en la URL (riesgo de seguridad). Se envía en el frame STOMP `CONNECT` mediante `connectHeaders`:

```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),

  connectHeaders: {
    Authorization: `Bearer ${accessToken}`,  // token JWT del usuario
  },

  reconnectDelay: 5000,   // reconexión automática cada 5s

  onConnect: () => {
    // 1. Suscripción al topic del workflow
    stompClient.subscribe(
      `/topic/workflow.${tenantId}.${workflowId}`,
      (message) => handleEvent(JSON.parse(message.body))
    );

    // 2. Suscripción personal para recibir DIAGRAM_SYNCED inicial
    stompClient.subscribe(
      '/user/queue/sync',
      (message) => handleSyncEvent(JSON.parse(message.body))
    );

    // 3. Notificar al servidor que el usuario abrió el canvas
    stompClient.publish({
      destination: `/app/diagram/${workflowId}/join`,
      body: JSON.stringify({}),
    });
  },

  onStompError: (frame) => {
    console.error('STOMP error:', frame.headers['message']);
  },
});

stompClient.activate();
```

### Dependencias npm necesarias

```bash
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

---

## Sección 2 — Topics, suscripciones y formato de eventos

### Topics

| Canal | Propósito |
|---|---|
| `/topic/workflow.{tenantId}.{workflowId}` | Broadcast general del workflow |
| `/user/queue/sync` | Entrega privada del estado inicial al conectarse |

### Estructura base de todos los eventos

```json
{
  "eventType": "DIAGRAM_CHANGED",
  "workflowId": "665a000000000000000000c1",
  "tenantId": "665a000000000000000000a1",
  "userId": "665a000000000000000000b1",
  "userName": "ana@empresa.com",
  "userColor": "#1d9e75",
  "payload": { ... },
  "timestamp": "2026-04-20T14:30:00"
}
```

### Eventos y sus payloads

#### `DIAGRAM_CHANGED` — cambio estructural en el canvas

```json
{
  "eventType": "DIAGRAM_CHANGED",
  "userId": "665a...",
  "userName": "ana@empresa.com",
  "userColor": "#1d9e75",
  "payload": {
    "uiSchema": "{\"enableRtl\":false,\"locale\":\"en-US\",\"nodes\":[...],...}"
  },
  "timestamp": "2026-04-20T14:30:00"
}
```

**Qué hacer en Angular:** Si `userId !== currentUserId`, llamar `diagram.loadDiagram(payload.uiSchema)`.

#### `DIAGRAM_SYNCED` — estado inicial al conectarse

Mismo formato que `DIAGRAM_CHANGED` pero llega por `/user/queue/sync`. Siempre cargar el canvas con este uiSchema al recibirlo.

#### `CURSOR_MOVED` — posición del cursor de otro usuario

```json
{
  "eventType": "CURSOR_MOVED",
  "userId": "665a...",
  "userName": "ana@empresa.com",
  "userColor": "#1d9e75",
  "payload": {
    "x": 342.5,
    "y": 218.0,
    "selectedNodeId": "node-3"
  },
  "timestamp": "2026-04-20T14:30:00"
}
```

**Qué hacer en Angular:** Renderizar un indicador de cursor flotante con el nombre y color del usuario.

#### `USER_JOINED` — nuevo usuario abrió el canvas

```json
{
  "eventType": "USER_JOINED",
  "userId": "665a...",
  "userName": "carlos@empresa.com",
  "payload": {
    "activeUsers": [
      { "userId": "665a...", "userName": "ana@empresa.com", "userColor": "#1d9e75" },
      { "userId": "665b...", "userName": "carlos@empresa.com", "userColor": "#378add" }
    ]
  }
}
```

**Qué hacer en Angular:** Reemplazar la lista completa de usuarios activos en la UI (no agregar uno, reemplazar todo).

#### `USER_LEFT` — usuario cerró el canvas

Mismo formato que `USER_JOINED`. Reemplazar la lista de activos y eliminar el cursor flotante del usuario.

---

## Sección 3 — Envío de eventos desde Angular

### Destinations exactos

| Acción | Destination STOMP |
|---|---|
| Abrir canvas | `/app/diagram/{workflowId}/join` |
| Cerrar canvas | `/app/diagram/{workflowId}/leave` |
| Cambio en el diagrama | `/app/diagram/{workflowId}/changed` |
| Mover cursor | `/app/diagram/{workflowId}/cursor` |

### Body de cada evento

#### JOIN y LEAVE — body vacío

```typescript
stompClient.publish({
  destination: `/app/diagram/${workflowId}/join`,
  body: JSON.stringify({}),
});
```

#### DIAGRAM_CHANGED — uiSchema completo

```typescript
// Llamar SOLO cuando el cambio fue iniciado por el usuario local (no por loadDiagram remoto)
const uiSchema = diagram.saveDiagram();  // Syncfusion API

stompClient.publish({
  destination: `/app/diagram/${workflowId}/changed`,
  body: JSON.stringify({ uiSchema }),
});
```

> **Importante:** `uiSchema` es el único campo del body. No enviar `nodes`, `edges` ni `lanes` por separado — el backend los ignora.

#### CURSOR_MOVED — coordenadas únicamente (sin uiSchema)

```typescript
stompClient.publish({
  destination: `/app/diagram/${workflowId}/cursor`,
  body: JSON.stringify({
    x: cursorX,
    y: cursorY,
    selectedNodeId: diagram.selectedItems.nodes[0]?.id ?? null,
  }),
});
```

> `CURSOR_MOVED` **nunca** incluye `uiSchema`. El backend no lo persiste en MongoDB; es efímero.

### Cuándo enviar cada evento en el ciclo de vida del canvas

```typescript
// Al abrir el componente del editor
ngOnInit() {
  this.connectWebSocket();
}

// Al cerrar el componente del editor
ngOnDestroy() {
  this.stompClient.publish({ destination: `/app/diagram/${workflowId}/leave` });
  this.stompClient.deactivate();
}

// En el listener de cambios de Syncfusion
diagram.collectionChange = (args) => {
  if (this.isApplyingRemoteChange) return;  // ← evitar el loop
  const uiSchema = diagram.saveDiagram();
  this.stompClient.publish({
    destination: `/app/diagram/${workflowId}/changed`,
    body: JSON.stringify({ uiSchema }),
  });
};

// En el listener de movimiento del mouse sobre el canvas
diagram.mouseMoveHandler = (args) => {
  // Throttle a máximo 10 eventos/segundo para no saturar
  this.stompClient.publish({
    destination: `/app/diagram/${workflowId}/cursor`,
    body: JSON.stringify({ x: args.position.x, y: args.position.y, selectedNodeId: null }),
  });
};
```

---

## Sección 4 — Endpoints REST

### `GET /api/v1/collaboration/workflows/{workflowId}/sessions`

Devuelve los usuarios activos actualmente en el canvas. Llamar **antes** de conectar el WebSocket para mostrar presencia inicial.

**Request:** Solo requiere el JWT en cookie/header.

**Response 200:**
```json
[
  {
    "userId": "665a000000000000000000b1",
    "userName": "ana@empresa.com",
    "userColor": "#1d9e75"
  },
  {
    "userId": "665a000000000000000000b2",
    "userName": "carlos@empresa.com",
    "userColor": "#378add"
  }
]
```

**Response vacío (canvas sin usuarios activos):**
```json
[]
```

---

### `GET /api/v1/collaboration/workflows/{workflowId}/sync`

Devuelve el `uiSchema` más reciente persistido en MongoDB. Útil al reconectarse para garantizar el estado actualizado antes de que llegue `DIAGRAM_SYNCED`.

**Request:** Solo requiere el JWT en cookie/header.

**Response 200:**
```json
{
  "workflowId": "665a000000000000000000c1",
  "uiSchema": "{\"enableRtl\":false,\"locale\":\"en-US\",\"nodes\":[...],\"connectors\":[...]}",
  "lastUpdatedBy": "665a000000000000000000b1",
  "lastUpdatedAt": "2026-04-20T14:29:55"
}
```

**Response 404:** Si el workflow no existe o no pertenece al tenant del usuario.

---

## Sección 5 — Flujo completo de conexión

Secuencia exacta que Angular debe seguir al abrir el editor de un workflow:

```
1. GET /api/v1/workflows/{workflowId}
   → Obtener el workflow completo con uiSchema
   → diagram.loadDiagram(workflow.uiSchema)

2. GET /api/v1/collaboration/workflows/{workflowId}/sessions
   → Obtener lista de usuarios ya conectados
   → Renderizar avatares/indicadores de presencia en la UI

3. Crear cliente STOMP con JWT en connectHeaders

4. onConnect → suscribirse a /topic/workflow.{tenantId}.{workflowId}
   → Aquí llegarán DIAGRAM_CHANGED, CURSOR_MOVED, USER_JOINED, USER_LEFT

5. onConnect → suscribirse a /user/queue/sync
   → Aquí llegará DIAGRAM_SYNCED con el estado más reciente

6. Publicar JOIN a /app/diagram/{workflowId}/join

7. Recibir DIAGRAM_SYNCED en /user/queue/sync
   → diagram.loadDiagram(event.payload.uiSchema)
   → A partir de aquí el canvas está sincronizado

8. Recibir USER_JOINED en el topic
   → Actualizar lista de usuarios activos en la UI

9. Listo — el usuario puede editar y las ediciones se broadcast automáticamente
```

---

## Sección 6 — El loop infinito y cómo evitarlo

### El problema

```
Admin A mueve un nodo
  → Angular A envía DIAGRAM_CHANGED al servidor
  → Servidor hace broadcast
  → Angular B recibe DIAGRAM_CHANGED
  → Angular B llama diagram.loadDiagram(uiSchema)
  → Syncfusion dispara collectionChange internamente
  → Angular B detecta el cambio
  → Angular B reenvía DIAGRAM_CHANGED al servidor
  → LOOP INFINITO ↩
```

### La solución — bandera `isApplyingRemoteChange`

```typescript
// En tu componente Angular
private isApplyingRemoteChange = false;

// En el listener de Syncfusion
diagram.collectionChange = () => {
  if (this.isApplyingRemoteChange) return;  // silenciar si es cambio remoto
  this.sendDiagramChanged();
};

// Al recibir DIAGRAM_CHANGED o DIAGRAM_SYNCED
handleEvent(event: DiagramEvent) {
  if (event.eventType === 'DIAGRAM_CHANGED' || event.eventType === 'DIAGRAM_SYNCED') {
    if (event.userId === this.currentUserId) return;  // ignorar propio eco

    this.isApplyingRemoteChange = true;
    try {
      this.diagram.loadDiagram(event.payload.uiSchema);
    } finally {
      this.isApplyingRemoteChange = false;  // siempre restaurar, incluso si hay error
    }
  }
}
```

> **El backend no puede resolver este problema.** El servidor no sabe si un DIAGRAM_CHANGED fue causado por un cambio del usuario o por `loadDiagram`. La bandera `isApplyingRemoteChange` es la única solución correcta y debe vivir en el frontend.

---

## Sección 7 — Manejo de desconexión

### Al cerrar el editor (`ngOnDestroy`)

```typescript
ngOnDestroy() {
  // 1. Notificar al servidor antes de desconectar
  this.stompClient.publish({
    destination: `/app/diagram/${this.workflowId}/leave`,
    body: JSON.stringify({}),
  });

  // 2. Desconectar el cliente STOMP
  this.stompClient.deactivate();
}
```

### TTL automático de 30 segundos

Si el navegador se cierra abruptamente (crash, pestaña cerrada sin `ngOnDestroy`), el servidor no recibe el mensaje LEAVE. MongoDB elimina automáticamente las entradas de `diagram_sessions` cuyo campo `last_seen` tenga más de **30 segundos** de antigüedad gracias al índice TTL configurado.

Esto significa que si un usuario se desconecta sin avisar, su sesión desaparece en ≤30s y el próximo `USER_JOINED` o polling de `/sessions` ya no lo incluirá.

### Reconexión automática

`@stomp/stompjs` maneja la reconexión automáticamente con `reconnectDelay: 5000`. Al reconectarse, el cliente re-ejecuta `onConnect`, lo que dispara de nuevo el flujo de suscripción y JOIN.

Para garantizar tener el estado más reciente al reconectarse:

```typescript
onConnect: () => {
  // Re-suscribirse (el cliente lo hace automáticamente)

  // Obtener el uiSchema más fresco vía REST antes del DIAGRAM_SYNCED
  this.collaborationService.sync(this.workflowId).subscribe(response => {
    this.isApplyingRemoteChange = true;
    try {
      this.diagram.loadDiagram(response.uiSchema);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  });

  // JOIN para reaparecer en la lista de activos
  this.stompClient.publish({
    destination: `/app/diagram/${this.workflowId}/join`,
  });
}
```

### Colores de usuario

El servidor asigna colores de la siguiente paleta. El color es estable mientras la sesión esté activa (TTL 30s):

| Color | Hex |
|---|---|
| Verde | `#1d9e75` |
| Azul | `#378add` |
| Naranja | `#d85a30` |
| Violeta | `#7f77dd` |
| Rosa | `#d4537e` |
| Lima | `#639922` |
| Ámbar | `#ba7517` |
| Rojo | `#e24b4a` |

Si hay más de 8 usuarios simultáneos, los colores se reutilizan desde el primero.

---

## Resumen de endpoints y destinations

| Tipo | Dirección | Descripción |
|---|---|---|
| REST GET | `/api/v1/collaboration/workflows/{id}/sessions` | Presencia inicial |
| REST GET | `/api/v1/collaboration/workflows/{id}/sync` | uiSchema más reciente |
| STOMP SUB | `/topic/workflow.{tenantId}.{workflowId}` | Broadcast general |
| STOMP SUB | `/user/queue/sync` | Estado inicial privado |
| STOMP PUB | `/app/diagram/{workflowId}/join` | Abrir canvas |
| STOMP PUB | `/app/diagram/{workflowId}/leave` | Cerrar canvas |
| STOMP PUB | `/app/diagram/{workflowId}/changed` | Cambio en el diagrama |
| STOMP PUB | `/app/diagram/{workflowId}/cursor` | Movimiento del cursor |
