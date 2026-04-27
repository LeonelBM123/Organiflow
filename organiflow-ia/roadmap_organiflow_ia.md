# Roadmap — Organiflow IA Microservice

> Archivo de seguimiento del proceso de refactorización y expansión del microservicio de IA.
> Actualizado automáticamente al completar cada hito.

---

## Estado General

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Roadmap y tracking | ✅ Completado |
| 1 | Infraestructura base | ✅ Completado |
| 2 | Ampliar models.py | ✅ Completado |
| 3 | Módulo core/ | ✅ Completado |
| 4 | Servicios SOLID | ✅ Completado |
| 5 | Routers FastAPI | ✅ Completado |
| 6 | Refactorizar main.py | ✅ Completado |
| 7 | Tests unitarios | ✅ Completado — 48/48 ✓ |

---

## Fase 0 — Roadmap y Tracking
**Objetivo:** Crear este archivo de seguimiento con todos los hitos planificados.

- [x] Crear `roadmap_organiflow_ia.md`

---

## Fase 1 — Infraestructura Base
**Objetivo:** Crear `requirements.txt` y la estructura de carpetas del proyecto.

- [x] Crear `requirements.txt` con todas las dependencias
- [x] Crear carpeta `core/` con `__init__.py`
- [x] Crear carpeta `services/` con `__init__.py`
- [x] Crear carpeta `routers/` con `__init__.py`
- [x] Crear carpeta `tests/` con `__init__.py` y `conftest.py`

**Qué se hizo:**
- `requirements.txt` generado con: fastapi, uvicorn[standard], pydantic, openai,
  python-dotenv, pytest, pytest-asyncio, httpx.
- Estructura de directorios creada con `__init__.py` en cada paquete.
- `tests/conftest.py` con 5 fixtures de workflow reutilizables.

---

## Fase 2 — Ampliar models.py
**Objetivo:** Extender los modelos Pydantic para soportar configuración completa de nodos,
análisis de workflows y generación de esquemas — compatible con el `node-panel` de Angular.

- [x] `FieldType` — Literal type para tipos de campo de formulario
- [x] `FormField` — Definición de un campo de formulario dinámico
- [x] `FormSchema` — Esquema de formulario completo para un nodo
- [x] `AiConfig` — Configuración de IA para nodos con asistencia automática
- [x] `OrganiflowNode` extendido — `departmentId`, `assignedUserId`, `timeoutHours`, `formSchema`, `aiConfig`
- [x] `WorkflowAnalysisRequest` — Payload para análisis de workflow
- [x] `LogicError` — Error lógico detectado (con severidad y sugerencia)
- [x] `Bottleneck` — Cuello de botella detectado
- [x] `WorkflowAnalysisResponse` — Respuesta del análisis completo
- [x] `NodeSchemaRequest` — Payload para generación de esquema de nodo
- [x] `NodeSchemaResponse` — Esquema generado por IA

**Qué se hizo:**
- `models.py` reescrito completamente con type hints estrictos, aliases para
  compatibilidad con el frontend Angular (camelCase ↔ snake_case), docstrings
  y validación con `ge=1` en `timeoutHours`.

---

## Fase 3 — Módulo core/
**Objetivo:** Crear módulos de responsabilidad única para los componentes transversales.

- [x] `core/llm_client.py` — Singleton `AsyncOpenAI` con `get_client()` cacheado via `lru_cache`
- [x] `core/prompt_builder.py` — `PromptBuilder` con 3 métodos estáticos:
  - `build_mutation_system()` — prompt original mejorado con schema actualizado
  - `build_analysis_system()` — prompt para análisis lógico UML
  - `build_schema_system()` — prompt para generación de FormSchema
- [x] `core/response_parser.py` — `parse_json_response()` que extrae JSON de markdown fences

**Qué se hizo:**
- Extraído el client de OpenRouter a `llm_client.py` con `RuntimeError` descriptivo
  si falta la API key.
- Centralizado el armado de prompts en `PromptBuilder` para facilitar su mantenimiento.
- Separado el parser de markdown en módulo testeable de forma independiente.

---

## Fase 4 — Servicios SOLID
**Objetivo:** Separar la lógica de negocio en servicios especializados.

- [x] `services/mutation_service.py` — `MutationService.generate_mutations()`
- [x] `services/analyzer_service.py` — `AnalyzerService.analyze()` con detección de:
  - [x] Nodos huérfanos (sin edges)
  - [x] START o END duplicados
  - [x] Sin nodo START o sin nodo END
  - [x] CONDITION sin ≥2 edges salientes
  - [x] MERGE sin ≥2 edges entrantes
  - [x] START sin edge saliente (WARNING)
  - [x] END con edges salientes (WARNING)
  - [x] Ciclos sin nodo ITERATOR (DFS)
  - [x] Nodos con ≥4 edges entrantes (cuello de botella)
  - [x] Carriles con >80% de nodos (solo si hay ≥2 carriles)
  - [x] Nodos TASK sin departamento asignado
- [x] `services/schema_generator_service.py` — `SchemaGeneratorService.generate_schema()`

**Qué se hizo:**
- `ai_service.py` original deprecado (mantenido para compatibilidad, no referenciado).
- `MutationService` extrae la lógica del endpoint original con inyección del client.
- `AnalyzerService` completamente determinístico (sin LLM), con algoritmo DFS para
  detección de ciclos sin ITERATOR.
- `SchemaGeneratorService` usa Claude con temperatura 0.3 para mayor creatividad.

---

## Fase 5 — Routers FastAPI
**Objetivo:** Crear los 3 routers con sus endpoints REST.

| Endpoint | Descripción | Estado |
|----------|-------------|--------|
| `POST /api/v1/ia/mutations` | Genera mutaciones de workflow | ✅ |
| `POST /api/v1/ia/analyze` | Detecta errores lógicos y cuellos de botella | ✅ |
| `POST /api/v1/ia/generate-schema` | Genera `FormSchema` para un nodo vía IA | ✅ |

- [x] `routers/mutations.py`
- [x] `routers/analysis.py`
- [x] `routers/schema.py`

**Qué se hizo:**
- Cada router tiene un único endpoint con docstring en `summary` y `description`
  visibles en Swagger UI.
- Manejo de errores con `HTTPException(500)` y `traceback.print_exc()`.

---

## Fase 6 — Refactorizar main.py
**Objetivo:** Limpiar el entry point, registrar routers y configurar CORS desde env vars.

- [x] Registrar los 3 routers con `app.include_router()`
- [x] Mover lista de origins CORS a variable desde `.env` (`CORS_ORIGINS`)
- [x] Añadir `lifespan` handler con logging de startup/shutdown
- [x] Eliminar endpoint inline heredado

**Qué se hizo:**
- `main.py` reducido a configuración pura: lifespan, CORS, registro de routers.
- `CORS_ORIGINS` leído desde `.env` (separado por comas); fallback a
  `localhost:4200` y `localhost:8080` para desarrollo local.
- Logging estructurado con `logging.basicConfig`.

---

## Fase 7 — Tests Unitarios
**Objetivo:** Cubrir la lógica crítica sin dependencia del LLM.

- [x] `tests/conftest.py` — 5 fixtures de workflow compartidos
- [x] `tests/test_models.py` — 22 tests de validación Pydantic
- [x] `tests/test_analyzer.py` — 16 tests unitarios para `AnalyzerService`
- [x] `tests/test_response_parser.py` — 10 tests para el parser de markdown

**Resultado:** `48 passed in 0.21s` ✓

**Qué se hizo:**
- Tests organizados en clases por funcionalidad.
- Cobertura de casos felices y edge cases.
- Corrección: detección de carril sobrecargado solo activa cuando hay ≥2 carriles.

---

## Arquitectura Final

```
organiflow-ia/
├── main.py                          ✅ Entry point (refactorizado)
├── models.py                        ✅ Pydantic schemas (ampliados)
├── ai_service.py                    ⚠️  Archivo legado (no referenciado)
├── requirements.txt                 ✅ Dependencias del proyecto
├── .env                             — Variables de entorno (sin cambios)
├── roadmap_organiflow_ia.md         ✅ Este archivo
├── core/
│   ├── __init__.py                  ✅
│   ├── llm_client.py               ✅ Singleton OpenRouter client
│   ├── prompt_builder.py           ✅ Prompts por tipo de operación
│   └── response_parser.py          ✅ Parser JSON / markdown
├── services/
│   ├── __init__.py                  ✅
│   ├── mutation_service.py         ✅ Generación de mutaciones
│   ├── analyzer_service.py         ✅ Análisis lógico + cuellos de botella
│   └── schema_generator_service.py ✅ Generación de FormSchema
├── routers/
│   ├── __init__.py                  ✅
│   ├── mutations.py                ✅ POST /api/v1/ia/mutations
│   ├── analysis.py                 ✅ POST /api/v1/ia/analyze
│   └── schema.py                   ✅ POST /api/v1/ia/generate-schema
└── tests/
    ├── __init__.py                  ✅
    ├── conftest.py                  ✅ 5 fixtures
    ├── test_models.py               ✅ 22 tests
    ├── test_analyzer.py             ✅ 16 tests
    └── test_response_parser.py      ✅ 10 tests
```

---

## Endpoints disponibles

| Método | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/ia/mutations` | `EditRequest` | `MutationPlan` |
| POST | `/api/v1/ia/analyze` | `WorkflowAnalysisRequest` | `WorkflowAnalysisResponse` |
| POST | `/api/v1/ia/generate-schema` | `NodeSchemaRequest` | `NodeSchemaResponse` |

## Cómo iniciar el servicio

```bash
cd organiflow-ia
uvicorn main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

---

## Changelog

| Fecha | Fase | Descripción |
|-------|------|-------------|
| 2026-04-27 | 0 | Creación del roadmap inicial |
| 2026-04-27 | 1 | requirements.txt + estructura de carpetas |
| 2026-04-27 | 2 | models.py ampliado con FormSchema, AiConfig, análisis |
| 2026-04-27 | 3 | Módulo core/ (llm_client, prompt_builder, response_parser) |
| 2026-04-27 | 4 | Servicios SOLID (mutation, analyzer, schema_generator) |
| 2026-04-27 | 5 | Routers FastAPI (3 endpoints) |
| 2026-04-27 | 6 | main.py refactorizado |
| 2026-04-27 | 7 | 48 tests unitarios — 48/48 ✓ |
