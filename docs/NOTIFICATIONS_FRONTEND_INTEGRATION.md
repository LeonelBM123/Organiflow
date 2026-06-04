# Integracion Frontend - Notificaciones

Este documento resume como consumir desde frontend web y movil el modulo de notificaciones implementado en backend.

## Resumen

El backend ahora expone dos canales para notificaciones:

- REST para cargar historial y marcar como leidas
- WebSocket STOMP para recibir eventos en tiempo real

Adicionalmente, para movil y web push:

- registro de dispositivos FCM
- envio push a los tokens asociados al usuario

## Endpoints REST

### 1. Obtener notificaciones

`GET /api/notifications?limit=50`

Respuesta:

```json
{
  "notifications": [
    {
      "id": "680ff...",
      "tenantId": "655a...",
      "userId": "67ab...",
      "type": "TASK_ASSIGNED",
      "title": "Nueva tarea asignada",
      "message": "Se te asigno la tarea 'Aprobacion'.",
      "entityType": "task",
      "entityId": "68100...",
      "read": false,
      "readAt": null,
      "priority": "MEDIUM",
      "metadata": {
        "workflowId": "69ed...",
        "executionId": "69ef...",
        "departmentId": "69f0...",
        "nodeId": "node_01",
        "nodeName": "Aprobacion",
        "dueAt": "2026-04-29T16:00:00Z"
      },
      "createdAt": "2026-04-29T04:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### 2. Obtener solo no leidas

`GET /api/notifications/unread`

### 3. Obtener contador no leidas

`GET /api/notifications/count`

Respuesta:

```json
{
  "count": 3
}
```

### 4. Marcar una notificacion como leida

`PUT /api/notifications/{id}/read`

### 5. Marcar todas como leidas

`PUT /api/notifications/read-all`

Respuesta:

```json
{
  "updated": 3
}
```

## Registro de dispositivos push

### Registrar token FCM

`POST /api/v1/users/devices`

Body:

```json
{
  "fcmToken": "token_fcm_del_dispositivo",
  "deviceType": "WEB"
}
```

Valores sugeridos para `deviceType`:

- `WEB`
- `ANDROID`
- `IOS`

### Eliminar token FCM

`DELETE /api/v1/users/devices`

Body:

```json
{
  "fcmToken": "token_fcm_del_dispositivo",
  "deviceType": "WEB"
}
```

### Listar dispositivos registrados del usuario

`GET /api/v1/users/devices`

## WebSocket STOMP

### Endpoint

Conectar a:

- `ws://<host>/ws`

Con SockJS si ya lo usan en web.

### Autenticacion

El backend acepta JWT por:

- header `Authorization: Bearer <token>` en el CONNECT de STOMP
- cookie `access_token` si el cliente web ya opera con cookies

### Destinos a suscribir

#### Notificaciones privadas

Suscribirse a:

- `/user/queue/notifications`

Por este canal llegan los eventos completos de nueva notificacion.

#### Contador privado

Suscribirse a:

- `/user/queue/notifications/count`

Por este canal llega el contador actualizado de no leidas.

Payload esperado:

```json
{
  "unreadCount": 4
}
```

## Evento WebSocket

Cuando llega una notificacion nueva, el backend envia un payload como este:

```json
{
  "id": "680ff...",
  "type": "TASK_OVERDUE",
  "title": "Tarea vencida",
  "message": "La tarea 'Revision Legal' ya vencio (29/04/2026 10:00).",
  "entityType": "task",
  "entityId": "68100...",
  "read": false,
  "priority": "URGENT",
  "metadata": {
    "workflowId": "69ed...",
    "executionId": "69ef...",
    "departmentId": "69f0...",
    "nodeId": "node_02",
    "nodeName": "Revision Legal",
    "dueAt": "2026-04-29T14:00:00Z"
  },
  "timestamp": "2026-04-29T14:05:00Z"
}
```

## Tipos de notificacion disponibles

Actualmente el backend puede emitir:

- `TASK_ASSIGNED`
- `TASK_COMPLETED`
- `TASK_DUE_SOON`
- `TASK_OVERDUE`
- `EXECUTION_STARTED`
- `EXECUTION_COMPLETED`
- `EXECUTION_CANCELED`

Tambien quedaron definidos para crecimiento futuro:

- `TASK_UPDATED`
- `EXECUTION_PAUSED`
- `WORKFLOW_PUBLISHED`
- `WORKFLOW_UPDATED`
- `SYSTEM_ALERT`
- `SLA_WARNING`

## Prioridades

Valores posibles:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

Sugerencia visual:

- `LOW`: gris o verde suave
- `MEDIUM`: azul
- `HIGH`: naranja
- `URGENT`: rojo

## Recomendacion para frontend web

### Flujo sugerido al iniciar sesion

1. Cargar `GET /api/notifications?limit=50`
2. Mostrar badge con `unreadCount`
3. Abrir conexion STOMP a `/ws`
4. Suscribirse a:
   - `/user/queue/notifications`
   - `/user/queue/notifications/count`

### Comportamiento recomendado al recibir evento

1. Insertar la notificacion al inicio de la lista
2. Actualizar badge
3. Mostrar toast/snackbar
4. Si `priority === "URGENT"`, considerar toast persistente

### Navegacion sugerida por `entityType`

- `task` -> abrir detalle de tarea
- `execution` -> abrir detalle de ejecucion
- `workflow` -> abrir workflow relacionado

### Estado local recomendado

Mantener:

- `notifications: Notification[]`
- `unreadCount: number`
- `socketConnected: boolean`

### Manejo de lectura

Cuando el usuario haga click en una notificacion:

1. navegar a la entidad
2. llamar `PUT /api/notifications/{id}/read`
3. actualizar el item local a `read = true`
4. decrementar badge local si aun no lo recibiste por socket

## Recomendacion para app movil

### Dos canales distintos

La app movil deberia usar ambos:

- push FCM para cuando la app esta en background o cerrada
- REST/WebSocket para cuando la app esta abierta

### Flujo sugerido

1. Obtener token FCM del dispositivo
2. Registrar token con `POST /api/v1/users/devices`
3. Al abrir app autenticada:
   - cargar historial por REST
   - opcionalmente abrir STOMP si quieren tiempo real foreground
4. Al cerrar sesion:
   - eliminar token con `DELETE /api/v1/users/devices`

### Deep link sugerido

El backend manda `metadata` y tambien puede adjuntar `route` en push.

Sugerencia para app movil:

- si `entityType = task`, navegar a pantalla de tarea
- si `entityType = execution`, navegar a pantalla de ejecucion
- usar `entityId` como identificador principal

## Mapeo de iconos sugerido

- `TASK_ASSIGNED` -> bandeja o clipboard
- `TASK_COMPLETED` -> check
- `TASK_DUE_SOON` -> reloj
- `TASK_OVERDUE` -> alerta
- `EXECUTION_STARTED` -> play
- `EXECUTION_COMPLETED` -> check-circle
- `EXECUTION_CANCELED` -> x-circle

## Consideraciones tecnicas

### Autorizacion

Todos los endpoints de `/api/notifications` requieren sesion valida.

`/api/v1/users/devices` tambien requiere autenticacion.

### Multi-tenant

El backend resuelve `tenantId` desde el JWT; el frontend no necesita mandarlo manualmente.

### Orden de listado

Las notificaciones REST salen ordenadas por `createdAt desc`.

### Lectura idempotente

Marcar como leida una notificacion ya leida no rompe el flujo.

## Checklist para frontend web

- [ ] Crear modelo `Notification`
- [ ] Consumir `GET /api/notifications`
- [ ] Mostrar badge con `unreadCount`
- [ ] Conectar STOMP a `/ws`
- [ ] Suscribirse a `/user/queue/notifications`
- [ ] Suscribirse a `/user/queue/notifications/count`
- [ ] Implementar `markAsRead`
- [ ] Implementar `markAllAsRead`
- [ ] Mostrar toast al recibir nueva notificacion

## Checklist para frontend movil

- [ ] Obtener token FCM
- [ ] Registrar token con `POST /api/v1/users/devices`
- [ ] Consumir `GET /api/notifications`
- [ ] Implementar bandeja local
- [ ] Implementar push foreground/background
- [ ] Resolver navegacion por `entityType` + `entityId`
- [ ] Eliminar token al cerrar sesion si aplica
