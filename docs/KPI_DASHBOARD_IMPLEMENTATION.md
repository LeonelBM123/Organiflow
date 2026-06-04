# KPI Dashboard Implementation

Este documento describe los KPI que hoy calcula el backend para alimentar el dashboard de Organiflow, qué significan funcionalmente y cómo se obtienen en la implementación actual.

## Alcance

La implementación actual del dashboard consume los KPI activos definidos en el módulo `kpi` del backend y los expone en el `summary` del endpoint:

- `GET /api/kpis/dashboard/{tenantId}`

Además del `summary`, el dashboard también construye:

- `topWorkflows`
- `topDepartments`
- `alerts`

## Convención de códigos

El frontend ahora consume los KPI usando el código canónico del backend, por ejemplo:

- `EXEC_ACTIVE_COUNT`
- `TASK_SLA_COMPLIANCE`
- `DEPT_TASK_LOAD`

Esto evita el desacople anterior entre claves camelCase del frontend y códigos reales del backend.

## KPI implementados

### 1. `EXEC_AVG_DURATION`

- Nombre funcional: Duración promedio de ejecución
- Qué mide: el tiempo promedio que tarda una ejecución en completarse
- Fuente: colección `executions`
- Criterio principal:
  - `status = COMPLETED`
  - `completed_at` dentro del período consultado
- Fórmula: promedio de `completed_at - started_at`
- Unidad: horas
- Lectura de negocio: ayuda a entender eficiencia operativa de workflows

### 2. `EXEC_COMPLETION_RATE`

- Nombre funcional: Tasa de completitud de ejecuciones
- Qué mide: qué porcentaje de ejecuciones iniciadas en el período terminó en estado `COMPLETED`
- Fuente: colección `executions`
- Fórmula:
  - numerador: ejecuciones completadas
  - denominador: ejecuciones iniciadas en el período
  - resultado: `(completed / total) * 100`
- Unidad: porcentaje
- Lectura de negocio: indica estabilidad y capacidad de cierre de los workflows

### 3. `EXEC_ACTIVE_COUNT`

- Nombre funcional: Ejecuciones activas
- Qué mide: cuántas ejecuciones están corriendo actualmente
- Fuente: colección `executions`
- Criterio principal:
  - `status = RUNNING`
- Unidad: cantidad
- Lectura de negocio: muestra carga operativa en tiempo real

### 4. `EXEC_CANCELLED_RATE`

- Nombre funcional: Tasa de cancelación
- Qué mide: qué porcentaje de ejecuciones iniciadas en el período terminó cancelado
- Fuente: colección `executions`
- Fórmula:
  - numerador: ejecuciones con `status = CANCELED`
  - denominador: ejecuciones iniciadas en el período
  - resultado: `(canceled / total) * 100`
- Unidad: porcentaje
- Lectura de negocio: sirve para detectar abandono, fallos de proceso o cancelaciones manuales excesivas

### 5. `TASK_PENDING_COUNT`

- Nombre funcional: Tareas pendientes
- Qué mide: cuántas tareas siguen abiertas
- Fuente: colección `tasks`
- Criterio principal:
  - `status IN (PENDING, IN_PROGRESS)`
- Unidad: cantidad
- Lectura de negocio: refleja backlog operativo inmediato

### 6. `TASK_COMPLETED_BY_USER`

- Nombre funcional: Tareas completadas por usuario
- Qué mide: cuántas tareas completó un usuario en el período
- Fuente: colección `tasks`
- Criterio principal:
  - `status = DONE`
  - `completed_at` dentro del período
- Unidad: cantidad
- Observación:
  - en el dashboard general se calcula sin segmentación por usuario, por lo que actúa más como total global de tareas completadas
  - su nombre sugiere uso segmentado; para análisis individual conviene invocarlo con `userId`

### 7. `TASK_AVG_RESOLUTION_TIME`

- Nombre funcional: Tiempo promedio de resolución
- Qué mide: cuánto tarda una tarea en resolverse desde que se crea hasta que se completa
- Fuente: colección `tasks`
- Criterio principal:
  - `status = DONE`
  - `completed_at` dentro del período
- Fórmula: promedio de `completed_at - created_at`
- Unidad: horas
- Lectura de negocio: permite ver eficiencia de atención de tareas humanas

### 8. `TASK_SLA_COMPLIANCE`

- Nombre funcional: Cumplimiento de SLA
- Qué mide: qué porcentaje de tareas se completó antes o en su fecha límite
- Fuente: colección `tasks`
- Criterio principal:
  - `status = DONE`
  - `completed_at` dentro del período
  - `due_at != null`
- Fórmula:
  - numerador: tareas con `completed_at <= due_at`
  - denominador: tareas completadas con SLA definido
  - resultado: `(onTime / total) * 100`
- Unidad: porcentaje
- Lectura de negocio: KPI principal de cumplimiento operativo

### 9. `TASK_OVERDUE_RATE`

- Nombre funcional: Tasa de tareas vencidas
- Qué mide: qué porcentaje de tareas se resolvió fuera del SLA
- Fuente: colección `tasks`
- Fórmula:
  - `100 - TASK_SLA_COMPLIANCE`
- Unidad: porcentaje
- Lectura de negocio: permite ver incumplimiento sin tener que inferirlo desde el SLA positivo

### 10. `NODE_SKIP_RATE`

- Nombre funcional: Tasa de saltos de nodo
- Qué mide: la frecuencia con la que nodos son omitidos por la lógica del workflow
- Estado actual: placeholder
- Valor actual en implementación: `0.0`
- Observación:
  - el KPI está definido en catálogo pero todavía no tiene cálculo real implementado
  - si aparece en el dashboard, hoy no representa comportamiento real

### 11. `DEPT_TASK_LOAD`

- Nombre funcional: Carga de trabajo por departamento
- Qué mide: cuántas tareas activas o pendientes tiene un departamento
- Fuente: colección `tasks`
- Implementación actual:
  - reutiliza la lógica de `TASK_PENDING_COUNT`
  - con segmentación por `departmentId`
- Unidad: cantidad
- Lectura de negocio: ayuda a detectar áreas saturadas

### 12. `DEPT_AVG_COMPLETION`

- Nombre funcional: Tiempo promedio por área
- Qué mide: cuánto tarda un departamento en completar tareas
- Fuente: colección `tasks`
- Implementación actual:
  - reutiliza la lógica de `TASK_AVG_RESOLUTION_TIME`
  - con segmentación por `departmentId`
- Unidad: horas
- Lectura de negocio: compara eficiencia entre áreas

### 13. `DEPT_SLA_RATE`

- Nombre funcional: Cumplimiento SLA por área
- Qué mide: qué porcentaje de tareas de un departamento cumple SLA
- Fuente: colección `tasks`
- Implementación actual:
  - reutiliza la lógica de `TASK_SLA_COMPLIANCE`
  - con segmentación por `departmentId`
- Unidad: porcentaje
- Lectura de negocio: compara calidad operativa entre departamentos

### 14. `TREND_DAILY_THROUGHPUT`

- Nombre funcional: Throughput diario
- Qué mide: cuántas ejecuciones completadas hubo dentro del período consultado
- Fuente: colección `executions`
- Criterio principal:
  - `status = COMPLETED`
  - `completed_at` dentro del período
- Unidad: cantidad
- Observación:
  - el nombre sugiere serie temporal diaria, pero la implementación actual devuelve un agregado simple del período

### 15. `TREND_WEEKLY_COMPLETION`

- Nombre funcional: Completitud semanal
- Qué mide: volumen de ejecuciones completadas en el período
- Fuente: colección `executions`
- Implementación actual:
  - reutiliza la misma lógica de `TREND_DAILY_THROUGHPUT`
- Unidad: cantidad
- Observación:
  - hoy no existe una diferencia de cálculo real frente a `TREND_DAILY_THROUGHPUT`; cambia más la intención analítica que la fórmula

### 16. `TREND_TASK_BACKLOG`

- Nombre funcional: Backlog de tareas
- Qué mide: el volumen de tareas abiertas al momento de la consulta
- Fuente: colección `tasks`
- Implementación actual:
  - reutiliza la lógica de `TASK_PENDING_COUNT`
- Unidad: cantidad
- Observación:
  - hoy representa backlog actual, no estrictamente backlog heredado de períodos anteriores

## Cómo se construye el `summary`

Para cada KPI activo:

1. Se calcula el valor del período actual.
2. Se calcula el valor del período anterior usando la misma ventana temporal.
3. Se deriva:
   - `value`
   - `change`
   - `trend`

### `change`

- Representa variación porcentual respecto al período anterior
- Fórmula general:
  - `((actual - anterior) / abs(anterior)) * 100`
- Caso especial:
  - si el valor anterior es `0` y el actual también es `0`, el cambio se reporta como `0`
  - si el valor anterior es `0` y el actual es mayor a `0`, el cambio se reporta como `100`

### `trend`

- `UP`: el valor actual es mayor al anterior
- `DOWN`: el valor actual es menor al anterior
- `FLAT`: no hubo cambio relevante

## Cómo se construyen los rankings

### `topWorkflows`

Cada workflow combina:

- ejecuciones activas actuales
- ejecuciones completadas en el período
- tasa de completitud

La lista se ordena por una puntuación simple:

- `score = activeCount + completedCount`

### `topDepartments`

Cada departamento combina:

- carga activa de tareas
- tareas completadas en el período
- tasa SLA del área

La lista se ordena por:

- `score = activeCount + completedCount`

## Alertas

El dashboard también devuelve alertas recientes del período:

- fuente: colección `kpi_alerts`
- incluyen:
  - código KPI
  - severidad
  - valor observado
  - umbral
  - mensaje
  - estado de reconocimiento

## Limitaciones actuales

- `NODE_SKIP_RATE` todavía no tiene cálculo real.
- `TREND_DAILY_THROUGHPUT` y `TREND_WEEKLY_COMPLETION` hoy son agregados simples, no series temporales.
- `TREND_TASK_BACKLOG` usa backlog actual, no backlog histórico puro.
- `TASK_COMPLETED_BY_USER` en dashboard general no está segmentado por usuario, por lo que su semántica actual es más global que individual.
- Los rankings usan una heurística simple (`activeCount + completedCount`) y pueden refinarse más adelante.

## Recomendaciones siguientes

- Implementar cálculo real de `NODE_SKIP_RATE`.
- Separar KPI de tendencia agregada versus KPI de serie temporal.
- Incorporar metadata más rica por KPI en backend:
  - nombre visible
  - descripción
  - unidad
  - si `UP` significa mejora o deterioro
- Definir explícitamente qué KPI deben mostrarse por rol:
  - admin
  - officer
  - user
