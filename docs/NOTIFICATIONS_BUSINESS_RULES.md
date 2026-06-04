# Reglas de Negocio - Notificaciones

Este documento resume en lenguaje funcional cuando se envian notificaciones en Organiflow, a quien se envian y por que canal llegan.

## Resumen

Actualmente las notificaciones pueden llegar por tres vias:

- bandeja interna de notificaciones
- tiempo real por WebSocket
- push movil por Firebase Cloud Messaging (FCM), si el usuario registro su dispositivo

Cada notificacion se guarda primero en backend y luego se distribuye a los canales disponibles del usuario.

## Eventos que hoy generan notificaciones

| Evento | Cuando ocurre | Quien la recibe | Tipo |
| --- | --- | --- | --- |
| Nueva tarea asignada | Cuando el workflow crea una nueva tarea | El usuario asignado directamente, o los miembros del departamento si la tarea no tiene usuario fijo | `TASK_ASSIGNED` |
| Tarea completada | Cuando una tarea pasa a estado completado | El usuario asignado de la tarea | `TASK_COMPLETED` |
| Tarea proxima a vencer | Cuando una tarea pendiente vence dentro de las proximas 24 horas | El usuario asignado de la tarea | `TASK_DUE_SOON` |
| Tarea vencida | Cuando una tarea pendiente ya paso su fecha limite | El usuario asignado de la tarea | `TASK_OVERDUE` |
| Ejecucion iniciada | Cuando un usuario inicia una ejecucion de workflow | El usuario que inicio la ejecucion | `EXECUTION_STARTED` |
| Ejecucion completada | Cuando la ejecucion llega a su fin | El usuario que inicio la ejecucion | `EXECUTION_COMPLETED` |
| Ejecucion cancelada | Cuando una ejecucion es cancelada | El usuario que inicio la ejecucion | `EXECUTION_CANCELED` |
| Notificacion de prueba | Cuando se llama el endpoint de prueba del backend | El usuario autenticado que hizo la prueba | `SYSTEM_ALERT` por defecto |

## Detalle por escenario

### 1. Nueva tarea asignada

Se envia cuando el motor del workflow crea una tarea desde un nodo operativo.

Reglas:

- si el nodo tenia un `assignedUserId`, la notificacion va solo a ese usuario
- si no tenia usuario fijo pero si `departmentId`, la notificacion va a los miembros del departamento
- el objetivo es avisar que ya existe trabajo disponible para atender

Mensaje esperado:

- "Nueva tarea asignada"
- o "Nueva tarea disponible" si fue distribuida por departamento

### 2. Tarea completada

Se envia cuando una tarea fue completada correctamente.

Reglas:

- hoy se notifica al usuario asignado de esa tarea
- en ciertos casos eso puede significar que el usuario se notifique a si mismo si era el responsable y tambien quien la completo

Uso esperado:

- confirmar cierre del trabajo
- dejar rastro en la bandeja interna

### 3. Tarea proxima a vencer

Se envia automaticamente por scheduler.

Reglas:

- corre cada 1 hora
- revisa tareas en estado `PENDING`
- considera proximas a vencer las que tienen `dueAt` dentro de las proximas 24 horas
- si ya existe una notificacion no leida de este tipo para la misma tarea, no vuelve a enviarla

Uso esperado:

- advertir riesgo antes de incumplir plazo

### 4. Tarea vencida

Se envia automaticamente por scheduler.

Reglas:

- corre cada 15 minutos
- revisa tareas en estado `PENDING`
- detecta tareas cuyo `dueAt` ya fue superado
- si ya existe una notificacion no leida de este tipo para la misma tarea, no vuelve a enviarla

Uso esperado:

- alertar incumplimiento de plazo
- priorizar accion correctiva

### 5. Ejecucion iniciada

Se envia cuando un usuario inicia una ejecucion de workflow.

Reglas:

- la recibe el usuario iniciador
- confirma que el proceso ya arranco

### 6. Ejecucion completada

Se envia cuando la ejecucion termina y alcanza su fin normal.

Reglas:

- la recibe el usuario iniciador
- confirma que el workflow concluyo correctamente

### 7. Ejecucion cancelada

Se envia cuando una ejecucion es cancelada manualmente.

Reglas:

- la recibe el usuario iniciador
- sirve como confirmacion y registro del evento

### 8. Notificacion de prueba

Existe un endpoint de prueba para validar la integracion movil o web:

- `POST /api/notifications/test`

Uso esperado:

- probar FCM
- probar la bandeja
- probar la navegacion por tap en movil

## Canales de entrega

### 1. Bandeja interna

Todas las notificaciones quedan persistidas y luego pueden verse en la bandeja del usuario.

### 2. Tiempo real

Si el usuario tiene una sesion conectada por WebSocket, recibe la notificacion en tiempo real.

Canales usados:

- `/user/queue/notifications`
- `/user/queue/notifications/count`

### 3. Push movil

Si el usuario registro un token FCM, el backend tambien enviara push al dispositivo.

Condiciones:

- el usuario debe haber iniciado sesion
- la app debe registrar el token en `/api/v1/users/devices`

## Tipos definidos pero aun no disparados

Estos tipos existen en backend, pero hoy no tienen una regla de negocio conectada:

- `TASK_UPDATED`
- `EXECUTION_PAUSED`
- `WORKFLOW_PUBLISHED`
- `WORKFLOW_UPDATED`
- `SLA_WARNING`

## Consideraciones funcionales

- Las notificaciones son multi-tenant: cada usuario solo recibe eventos de su tenant actual.
- Las alertas de vencimiento y proximo vencimiento no se repiten indefinidamente mientras exista una no leida equivalente para la misma tarea.
- Las notificaciones antiguas se limpian automaticamente despues de 90 dias.
- Si un usuario no tiene dispositivo registrado, igual recibira la notificacion en bandeja y por WebSocket si esta conectado.
