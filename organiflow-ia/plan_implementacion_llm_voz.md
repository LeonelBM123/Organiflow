
# Plan de Implementación: Configuración de Nodos por Voz con LLM

> **Estado:** Pendiente  
> **Fecha:** 2026-04-27  
> **Alcance:** Microservicio `organiflow-ia` + componente `node-panel` de Angular

---

## 1. Arquitectura Propuesta

El flujo completo desde la voz del usuario hasta el formulario renderizado en pantalla:

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER (Angular)                                                  │
│                                                                     │
│  [Mic button en node-panel]                                         │
│       │                                                             │
│       ▼                                                             │
│  Web Speech API  ──── transcripción ────►  node-panel.component.ts │
│                                                   │                 │
│                          NodeSchemaRequest        │                 │
│               { nodeType, context, voiceTranscript, deptName }      │
│                                                   │                 │
└───────────────────────────────────────────────────┼─────────────────┘
                                                    │ HTTP POST
                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MICROSERVICIO PYTHON  (organiflow-ia)                              │
│                                                                     │
│  POST /api/v1/ia/generate-schema                                    │
│       │                                                             │
│       ▼                                                             │
│  SchemaGeneratorService                                             │
│       │                                                             │
│       ├── voiceTranscript presente?                                 │
│       │        YES → prompt enriquecido con la transcripción        │
│       │        NO  → flujo actual (contexto de texto solamente)     │
│       │                                                             │
│       ▼                                                             │
│  Claude (anthropic/claude-haiku-4.5)                                │
│       │                                                             │
│       ▼                                                             │
│  NodeSchemaResponse { formSchema, reasoning }                       │
└───────────────────────────────────────────────────┬─────────────────┘
                                                    │ JSON
                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ANGULAR — node-panel                                               │
│                                                                     │
│  _applyGeneratedSchema(response.formSchema)                         │
│       │                                                             │
│       ▼                                                             │
│  FormArray reconstruido con los campos generados                    │
│       │                                                             │
│       ▼                                                             │
│  Template renderiza las field-cards dinámicamente                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Decisión de diseño clave

**No creamos un nuevo endpoint de voz**. En cambio, extendemos el endpoint existente
`POST /api/v1/ia/generate-schema` añadiendo un campo opcional `voiceTranscript` al
request model. Cuando ese campo está presente, el LLM recibe la transcripción como
contexto primario de intención del usuario, enriquecida con el nombre del nodo y el
departamento.

**Ventajas:**
- Un solo endpoint, contrato simplificado con Angular
- El `AiService` de Angular no necesita una nueva llamada HTTP
- La transcripción y el texto del campo "Nombre del nodo" se complementan

---

## 2. Selección de Herramientas

### Reconocimiento de voz — Navegador (sin API key)

| Herramienta | Justificación |
|---|---|
| **Web Speech API** (`SpeechRecognition`) | Ya está integrada en el proyecto para el canvas. Sin costo. Sin backend adicional. Soportada en Chromium. |

El `node-panel` reusará exactamente el mismo patrón que `workflow-editor.component.ts`
ya tiene: señales `isRecording` + `isSpeechSupported()` + toggle `SpeechRecognition`.

### LLM — Microservicio Python

| Herramienta | Justificación |
|---|---|
| **Claude Haiku 4.5** vía OpenRouter | Ya configurado en `core/llm_client.py`. Rápido y económico para generación de formularios. |
| **Pydantic v2** | Ya en uso, garantiza deserialización segura del JSON de Claude. |

No se necesita whisper, assemblyai ni ninguna librería de ASR en Python: la
transcripción ocurre completamente en el navegador con la Web Speech API gratuita.

---

## 3. Estructura de Datos

### 3.1 Request: Angular → Python

```jsonc
// POST /api/v1/ia/generate-schema
{
  "nodeType": "TASK",
  "context": "Revisión de Crédito",           // nombre del nodo (siempre presente)
  "departmentName": "Riesgos",                 // de selectedDepartmentId() (opcional)
  "language": "es",
  "voiceTranscript": "necesito un campo para   // NUEVO — opcional, llega cuando el
    el monto solicitado, uno para el historial  // usuario usó el micrófono
    crediticio y un campo de aprobación o
    rechazo con sus notas"
}
```

Modelo Python correspondiente en `models.py` (extensión de `NodeSchemaRequest`):

```python
class NodeSchemaRequest(BaseModel):
    node_type: NodeType
    context: str
    department_name: Optional[str] = None
    language: str = "es"
    voice_transcript: Optional[str] = Field(    # NUEVO
        default=None,
        description="Transcripción de voz del usuario describiendo el formulario deseado"
    )
```

### 3.2 Response: Python → Angular

Sin cambios. El contrato existente ya es completo:

```jsonc
{
  "formSchema": {
    "name": "Formulario de Revisión de Crédito",
    "fields": [
      {
        "name": "monto_solicitado",
        "label": "Monto Solicitado",
        "type": "number",
        "required": true,
        "options": [],
        "sortOrder": 1,
        "validationRules": {},
        "visibilityConditions": {}
      },
      {
        "name": "historial_crediticio",
        "label": "Historial Crediticio",
        "type": "select",
        "required": true,
        "options": ["Bueno", "Regular", "Malo"],
        "sortOrder": 2,
        "validationRules": {},
        "visibilityConditions": {}
      },
      {
        "name": "decision",
        "label": "Decisión",
        "type": "select",
        "required": true,
        "options": ["Aprobado", "Rechazado", "Revisión adicional"],
        "sortOrder": 3,
        "validationRules": {},
        "visibilityConditions": {}
      },
      {
        "name": "notas",
        "label": "Notas",
        "type": "textarea",
        "required": false,
        "options": [],
        "sortOrder": 4,
        "validationRules": {},
        "visibilityConditions": {}
      }
    ]
  },
  "reasoning": "Campos generados a partir de la descripción de voz del usuario..."
}
```

### 3.3 TypeScript — extensión de `NodeSchemaRequest`

Archivo: `organiflow-frontend/src/app/features/workflows/models/workflow.model.ts`

```typescript
export interface NodeSchemaRequest {
  nodeType: NodeType;
  context: string;
  departmentName?: string;
  language?: string;
  voiceTranscript?: string;   // NUEVO — campo opcional
}
```

---

## 4. Pasos de Implementación

### Fase A — Microservicio Python

#### A1. `models.py` — Extender `NodeSchemaRequest`

Añadir campo `voice_transcript: Optional[str] = None` con su Field descriptor.

#### A2. `core/prompt_builder.py` — Actualizar `build_schema_system()`

Añadir una sección en el prompt que instruya al modelo sobre cómo tratar
la transcripción de voz cuando esté presente. El método no necesita parámetros;
el contexto de voz llega en el mensaje de usuario (no en el system prompt).

#### A3. `services/schema_generator_service.py` — Enriquecer el user message

```python
# Lógica actual (solo texto):
user_message = (
    f"Tipo de nodo: {request.node_type}\n"
    f"Contexto del proceso: {request.context}{dept_info}\n"
    f"Idioma para los labels: {request.language}"
)

# Nueva lógica (con voz opcional):
voice_section = (
    f"\n\nINSTRUCCIÓN DE VOZ DEL USUARIO:\n{request.voice_transcript}"
    if request.voice_transcript
    else ""
)
user_message = (
    f"Tipo de nodo: {request.node_type}\n"
    f"Contexto del proceso: {request.context}{dept_info}\n"
    f"Idioma para los labels: {request.language}"
    f"{voice_section}"
)
```

Cuando el usuario dicta, `voice_section` pasa al LLM como fuente primaria de
intención. Claude da prioridad a la transcripción sobre el nombre genérico del nodo.

#### A4. `tests/test_schema_generator.py` — Tests unitarios (nuevo archivo)

- Test con solo `context` (comportamiento actual sin regresiones)
- Test con `voice_transcript` presente → campos deben reflejar lo dictado
- Test mock del cliente LLM para no consumir tokens en CI

---

### Fase B — Frontend Angular

#### B1. `workflow.model.ts` — Añadir `voiceTranscript?` a `NodeSchemaRequest`

Un campo opcional, sin impacto en el código existente.

#### B2. `ai.service.ts` — Sin cambios

El método `generateSchema(request: NodeSchemaRequest)` ya envía el objeto completo.
Al agregar `voiceTranscript` al modelo, se serializa automáticamente si está definido.

#### B3. `node-panel.component.ts` — Añadir lógica de voz

Nuevas señales:
```typescript
readonly isRecording    = signal(false);
readonly isSpeechSupported = signal('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
private recognition: SpeechRecognition | null = null;
private lastTranscript  = signal('');
```

Métodos:
- `initSpeechRecognition()` — configura el objeto `SpeechRecognition` con `lang: 'es-ES'`
- `toggleRecording()` — inicia/detiene la grabación
- Modificar `generateSchema()` para incluir `voiceTranscript: this.lastTranscript()` cuando hay transcripción

Flujo completo en `generateSchema()`:
```typescript
generateSchema(): void {
  // ...setup existente...
  this.aiService.generateSchema({
    node_type:       node.type,
    context:         this.form.get('name')?.value || node.name,
    department_name: dept?.name,
    language:        'es',
    voiceTranscript: this.lastTranscript() || undefined,  // NUEVO
  }).subscribe({ ... });
}
```

#### B4. `node-panel.component.html` — Añadir botón de micrófono

Añadir un botón mic junto al botón "Generar con IA" existente. El botón:
- Solo se muestra si `isSpeechSupported()` es true
- Cambia a estado "grabando" con animación de pulso (igual que el canvas)
- Muestra el transcript parcial mientras graba
- Al detener, el transcript queda en `lastTranscript()` listo para el siguiente clic en "Generar con IA"

```html
<!-- Bloque de voz + botón generar (reemplaza el botón actual) -->
<div class="generate-row">
  @if (isSpeechSupported()) {
    <button type="button" class="btn-mic"
      [class.btn-mic--recording]="isRecording()"
      [disabled]="isGeneratingSchema()"
      (click)="toggleRecording()"
      [attr.aria-label]="isRecording() ? 'Detener grabación' : 'Dictar configuración del formulario'"
      [attr.aria-pressed]="isRecording()">
      <!-- SVG micrófono / stop -->
    </button>
  }
  <button type="button" class="btn-generate-schema"
    [disabled]="isGeneratingSchema()"
    (click)="generateSchema()">
    <!-- spinner / estrella SVG -->
    Generar con IA
  </button>
</div>

@if (lastTranscript()) {
  <p class="voice-transcript-preview">"{{ lastTranscript() }}"</p>
}
```

#### B5. `node-panel.component.scss` — Estilos del micrófono y preview

- `.generate-row` — flexbox horizontal para alinear mic + botón generar
- `.btn-mic` — botón circular 30×30px, igual al del canvas
- `.btn-mic--recording` — color rojo + animación `mic-pulse`
- `.voice-transcript-preview` — texto en cursiva, color `--text-secondary`, font-size 11px

---

## 5. Archivos a Modificar (Resumen)

| Archivo | Tipo de cambio |
|---|---|
| `organiflow-ia/models.py` | Agregar `voice_transcript` a `NodeSchemaRequest` |
| `organiflow-ia/core/prompt_builder.py` | Actualizar instrucción para priorizar voz |
| `organiflow-ia/services/schema_generator_service.py` | Enriquecer `user_message` con transcript |
| `organiflow-ia/tests/test_schema_generator.py` | Nuevo archivo de tests |
| `organiflow-frontend/.../workflow.model.ts` | Agregar `voiceTranscript?` a `NodeSchemaRequest` |
| `organiflow-frontend/.../node-panel.component.ts` | Señales + `initSpeechRecognition()` + `toggleRecording()` |
| `organiflow-frontend/.../node-panel.component.html` | Botón mic + preview de transcripción |
| `organiflow-frontend/.../node-panel.component.scss` | `.generate-row`, `.btn-mic`, `.voice-transcript-preview` |

**No se crea ningún endpoint nuevo.** El endpoint existente
`POST /api/v1/ia/generate-schema` absorbe la nueva funcionalidad con un campo opcional.

---

## 6. Verificación End-to-End

1. `cd organiflow-ia && uvicorn main:app --reload --port 8005`
2. Abrir Swagger UI en `http://localhost:8005/docs`
3. Llamar `POST /api/v1/ia/generate-schema` con:
   ```json
   {
     "node_type": "TASK",
     "context": "Aprobación de Préstamo",
     "department_name": "Finanzas",
     "language": "es",
     "voice_transcript": "necesito el monto, la tasa de interés, el plazo en meses y una decisión de aprobado o rechazado"
   }
   ```
   → Respuesta debe incluir exactamente esos 4 campos en el `formSchema`.
4. `cd organiflow-frontend && ng serve`
5. Abrir el editor de un workflow en estado DRAFT
6. Hacer clic en un nodo TASK → se abre el `node-panel`
7. Hacer clic en el botón de micrófono → decir "necesito un campo de monto y uno de fecha de vencimiento"
8. Hacer clic en "Generar con IA" → los campos aparecen en el formulario
9. `cd organiflow-ia && pytest tests/` → todos los tests pasan incluyendo los nuevos de voz
