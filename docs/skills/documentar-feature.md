# Skill: Documentar Feature de Organiflow

Usa esta skill cada vez que se complete o se vaya a documentar una feature de Organiflow.
Genera un archivo `docs/features/[nombre-feature].md` con la estructura completa a continuación.

---

## Instrucciones para Claude

Cuando se te pida documentar una feature:

1. **Lee todos los archivos relevantes** del módulo antes de escribir:
   - `modules/[feature]/models/*.java`
   - `modules/[feature]/dtos/*.java`
   - `modules/[feature]/repositories/*.java`
   - `modules/[feature]/services/*.java`
   - `modules/[feature]/controllers/*.java`
   - `features/[feature]/` en el frontend Angular
   - Si tiene IA: `modules/ai/` y los prompts relacionados

2. **No inventes** información que no esté en el código. Si algo no está implementado aún, márcalo como `🔲 Pendiente`.

3. **Guarda el archivo** en `docs/features/[nombre-feature].md`

---

## Plantilla de documentación

Genera el archivo con exactamente esta estructura:

```markdown
# Feature: [Nombre legible de la feature]

> **Módulo:** `[nombre-modulo]`
> **Estado:** `En desarrollo` | `Completado` | `Parcialmente implementado`
> **Última actualización:** [fecha]
> **Actores involucrados:** `Usuario` | `Administrador` | `Funcionario` (los que apliquen)

---

## 1. ¿Qué hace esta feature?

[Descripción en 2-4 oraciones. Qué problema resuelve, qué permite hacer y en qué contexto
de Organiflow vive. Ejemplo: "Permite a los administradores definir nodos dentro de un
workflow. Cada nodo representa una tarea asignada a un área específica y puede tener
formularios, relaciones y lógica de IA asociada."]

---

## 2. Flujo de negocio

### ¿Quién la usa y cómo?

| Actor | Acción | Resultado |
|-------|--------|-----------|
| Administrador | [acción concreta] | [qué pasa] |
| Funcionario | [acción concreta] | [qué pasa] |
| Usuario | [acción concreta] | [qué pasa] |

*(Elimina las filas de actores que no apliquen a esta feature)*

### Casos de uso principales

**CU-01: [Nombre del caso de uso]**
- **Actor:** [quién]
- **Precondición:** [qué debe existir antes]
- **Flujo:** 
  1. [paso 1]
  2. [paso 2]
  3. ...
- **Resultado:** [qué queda guardado o qué cambia]

**CU-02: [Nombre del caso de uso]**
- *(repetir estructura)*

---

## 3. Backend

### Modelo de datos

**Colección MongoDB:** `[nombre_coleccion]`

```java
// Campos principales del documento
[pegar la clase del modelo resumida — solo campos, sin métodos]
```

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | `String` | ObjectId de MongoDB | Auto |
| `tenantId` | `String` | Empresa a la que pertenece | ✅ |
| `[campo]` | `[tipo]` | [descripción] | ✅ / ❌ |

### DTOs

**Request — `[NombreRequest.java]`**
```java
[contenido del record]
```

**Response — `[NombreResponse.java]`**
```java
[contenido del record]
```

### Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/api/[recurso]` | `ADMIN` | Crear [recurso] |
| `GET` | `/api/[recurso]` | `ADMIN` | Listar todos del tenant |
| `GET` | `/api/[recurso]/{id}` | `ADMIN, FUNCIONARIO` | Obtener por ID |
| `PUT` | `/api/[recurso]/{id}` | `ADMIN` | Actualizar |
| `DELETE` | `/api/[recurso]/{id}` | `ADMIN` | Eliminar |

*(Ajusta los roles según lo que tenga el @PreAuthorize en el controller)*

### Lógica de negocio destacada

[Describir en bullets cualquier lógica no trivial del Service. Por ejemplo:
- Validaciones de negocio que van más allá de @Valid
- Cálculos o transformaciones importantes
- Interacciones con otros módulos
- Eventos o notificaciones que dispara]

---

## 4. Frontend (Angular)

### Estructura de archivos

```
features/[nombre-feature]/
├── models/
│   └── [nombre].model.ts         → interfaz TypeScript + tipos
├── services/
│   └── [nombre].service.ts       → llamadas HTTP al backend
├── components/
│   ├── [nombre]-list/             → listado con signals
│   └── [nombre]-form/             → formulario reactivo
└── pages/
    └── [nombre].page.ts           → página principal (routed)
```

### Interfaz TypeScript principal

```typescript
[pegar la interfaz del modelo]
```

### Servicio HTTP

**Archivo:** `[nombre].service.ts`

| Método | Llama a | Descripción |
|--------|---------|-------------|
| `getAll()` | `GET /api/[recurso]` | [descripción] |
| `getById(id)` | `GET /api/[recurso]/{id}` | [descripción] |
| `create(req)` | `POST /api/[recurso]` | [descripción] |
| `update(id, req)` | `PUT /api/[recurso]/{id}` | [descripción] |
| `delete(id)` | `DELETE /api/[recurso]/{id}` | [descripción] |

### Estado (Signals)

```typescript
// Signals principales del componente
[nombre]s = signal<[Nombre][]>([]);
loading  = signal(false);
error    = signal<string | null>(null);
selected = signal<[Nombre] | null>(null);
```

### Ruta

```typescript
// En app.routes.ts
{
  path: '[ruta]',
  loadComponent: () => import('./features/[nombre]/pages/[nombre].page')
    .then(m => m.[Nombre]Page),
  canActivate: [authGuard]
}
```

---

## 5. Inteligencia Artificial (si aplica)

> *(Omitir esta sección si la feature no tiene IA integrada)*

### ¿Qué hace la IA en esta feature?

[Descripción concreta: qué interpreta, qué genera, qué automatiza]

### Flujo técnico de voz

```
1. Usuario habla en el browser
2. Web Speech API transcribe a texto en tiempo real
3. Angular envía texto → POST /api/ai/[endpoint]
4. Spring Boot arma el prompt con contexto del [workflow/formulario/etc.]
5. Claude API interpreta y devuelve JSON estructurado
6. Spring Boot valida y retorna al frontend
7. Angular ejecuta la acción en el canvas / rellena el formulario
```

### Endpoint de IA involucrado

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/ai/[endpoint]` | `{ "transcript": "...", "context": {...} }` | `{ "action": "...", "params": {...} }` |

### Comandos de voz soportados

*(Listar los comandos/frases que esta feature entiende y qué acción disparan)*

| Comando / frase de ejemplo | Intención detectada | Acción ejecutada |
|----------------------------|---------------------|------------------|
| `"crea un nodo de aprobación"` | `CREATE_NODE` | Agrega nodo al canvas |
| `"conéctalo con el nodo de revisión de forma condicional"` | `CONNECT_NODE_CONDITIONAL` | Crea relación condicional |
| `"el solicitante es Juan Pérez, el tipo es trifásico"` | `FILL_FORM_FIELDS` | Mapea campos del formulario |
| *(agregar todos los comandos relevantes)* | | |

### Prompt del sistema usado (System Prompt)

**Archivo:** `modules/ai/prompts/[nombre-prompt].java` *(o donde esté definido)*

```
[Pegar o describir el system prompt que se manda a Claude API para esta feature.
Si no está implementado aún, escribir el prompt recomendado.]
```

### Ejemplo de llamada completa

**Request al backend:**
```json
{
  "transcript": "[ejemplo de frase del usuario]",
  "context": {
    "[campo de contexto]": "[valor]"
  }
}
```

**Respuesta de Claude (interpretada por Spring Boot):**
```json
{
  "action": "[NOMBRE_ACCION]",
  "params": {
    "[param]": "[valor]"
  }
}
```

---

## 6. Dependencias con otras features

| Feature | Tipo de dependencia | Descripción |
|---------|---------------------|-------------|
| `auth` | Requerida | Necesita JWT válido para todos los endpoints |
| `tenant` | Requerida | Todos los datos se filtran por `tenantId` |
| `[otra-feature]` | [Requerida / Opcional] | [por qué] |

---

## 7. Decisiones de diseño

*(Solo las decisiones no obvias que valga la pena recordar)*

- **[Decisión]:** [Por qué se hizo así y qué alternativa se descartó]
- **[Decisión]:** [ídem]

---

## 8. Pendientes / TODOs

- 🔲 [cosa pendiente de implementar]
- 🔲 [otra cosa pendiente]
- ✅ [cosa ya completada — opcional, para tener historial]

---

## 9. Notas para el desarrollador

[Cualquier gotcha, advertencia, o contexto extra que no encaje en las secciones anteriores.
Por ejemplo: "MongoDB no soporta joins, por eso X se desnormaliza en Y" o
"El canvas usa una librería externa que tiene esta limitación..."]
```

---

## Cómo invocar esta skill

Cuando quieras documentar una feature, dile a Claude:

```
Documenta la feature [nombre] siguiendo la skill de documentación.
Lee todos los archivos del módulo antes de escribir.
Guarda el resultado en docs/features/[nombre].md
```

---

## Convenciones de nomenclatura para los archivos

| Feature | Archivo generado |
|---------|-----------------|
| Autenticación | `docs/features/auth.md` |
| Gestión de usuarios | `docs/features/user.md` |
| Workflows | `docs/features/workflow.md` |
| Ejecución de workflows | `docs/features/execution.md` |
| Nodos | `docs/features/node.md` |
| Formularios dinámicos | `docs/features/form.md` |
| Tareas de funcionarios | `docs/features/task.md` |
| Departamentos/Áreas | `docs/features/department.md` |
| IA — comandos de voz | `docs/features/ai-voice-commands.md` |
| IA — formularios por voz | `docs/features/ai-voice-forms.md` |
| Notificaciones WebSocket | `docs/features/notifications.md` |
