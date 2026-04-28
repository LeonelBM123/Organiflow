"""
Modelos Pydantic para el microservicio de IA de Organiflow.

Compatibles con las interfaces TypeScript del node-panel de Angular:
  WorkflowNode, FormField, FormSchema, AiConfig, Department, etc.
"""
from __future__ import annotations

import uuid
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Tipos auxiliares
# ---------------------------------------------------------------------------

NodeType = Literal["START", "TASK", "CONDITION", "MERGE", "ITERATOR", "END"]
EdgeRelationType = Literal["SEQUENTIAL", "CONDITIONAL", "ITERATIVE", "MERGE"]
FieldType = Literal[
    "text", "number", "select", "multiselect", "date", "file", "boolean", "textarea"
]
ErrorSeverity = Literal["ERROR", "WARNING", "INFO"]


# ---------------------------------------------------------------------------
# Modelos de formulario dinámico (espejo de Angular FormField / FormSchema)
# ---------------------------------------------------------------------------

class FormField(BaseModel):
    """Definición de un campo de formulario dinámico para un nodo TASK/ITERATOR."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(description="Nombre interno del campo, p.ej. 'monto_solicitado'")
    label: str = Field(description="Etiqueta visible, p.ej. 'Monto Solicitado'")
    type: FieldType = Field(default="text", description="Tipo de control de UI")
    required: bool = Field(default=False, description="Si el campo es obligatorio")
    options: List[str] = Field(
        default_factory=list,
        description="Opciones para tipos select/multiselect",
    )
    sort_order: int = Field(
        default=1,
        ge=1,
        description="Posición de visualización del campo (1-based)",
    )
    validation_rules: dict[str, Any] = Field(
        default_factory=dict,
        description="Reglas de validación futuras",
    )
    visibility_conditions: dict[str, Any] = Field(
        default_factory=dict,
        description="Condiciones de visibilidad condicional futuras",
    )


class FormSchema(BaseModel):
    """Esquema de formulario completo asociado a un nodo."""

    name: str = Field(description="Nombre descriptivo del formulario")
    fields: List[FormField] = Field(
        default_factory=list,
        description="Campos del formulario en orden de visualización",
    )


# ---------------------------------------------------------------------------
# Configuración de IA por nodo
# ---------------------------------------------------------------------------

class AiConfig(BaseModel):
    """Configuración de asistencia de IA para un nodo TASK/ITERATOR."""

    prompt: str = Field(description="Instrucción/plantilla para la IA")
    model: str = Field(
        default="claude-sonnet-4-6",
        description="Modelo de IA a utilizar",
    )
    auto_execute: bool = Field(
        default=False,
        alias="autoExecute",
        description="Ejecutar la IA automáticamente al ingresar al nodo",
    )

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Entidades principales del workflow
# ---------------------------------------------------------------------------

class OrganiflowNode(BaseModel):
    """Nodo de un diagrama de actividades UML con soporte completo de configuración."""

    id: Optional[str] = Field(
        default=None,
        description="ID único del nodo (autogenerado si no se proporciona)",
    )
    type: NodeType = Field(default="TASK", description="Tipo de nodo UML")
    name: Optional[str] = Field(default=None, description="Nombre visible del nodo")
    lane_id: Optional[str] = Field(
        default=None,
        alias="laneId",
        description="ID del carril (departamento) al que pertenece",
    )
    department_id: Optional[str] = Field(
        default=None,
        alias="departmentId",
        description="ID del departamento asignado",
    )
    assigned_user_id: Optional[str] = Field(
        default=None,
        alias="assignedUserId",
        description="ID del usuario específico asignado al nodo",
    )
    timeout_hours: Optional[int] = Field(
        default=None,
        alias="timeoutHours",
        ge=1,
        description="Horas antes de auto-escalar la tarea",
    )
    form_schema: Optional[FormSchema] = Field(
        default=None,
        alias="formSchema",
        description="Esquema de formulario para nodos TASK/ITERATOR",
    )
    ai_config: Optional[AiConfig] = Field(
        default=None,
        alias="aiConfig",
        description="Configuración de IA para asistencia automática",
    )

    model_config = {"populate_by_name": True}

    def model_post_init(self, __context: object) -> None:
        if not self.id:
            self.id = f"node-{uuid.uuid4().hex[:8]}"


class OrganiflowLane(BaseModel):
    """Carril (swimlane) que representa un departamento o área."""

    id: Optional[str] = Field(
        default=None,
        description="ID del carril (p.ej. 'dept-comercial')",
    )
    name: str = Field(description="Nombre del carril o departamento")


ConditionOperator = Literal["==", "!=", ">", "<", ">=", "<=", "contains"]


class ConditionRule(BaseModel):
    """Regla de condición para un conector CONDITIONAL."""

    model_config = {"populate_by_name": True}

    field: str = Field(description="Nombre del campo del formulario a evaluar")
    operator: ConditionOperator = Field(description="Operador de comparación")
    value: Any = Field(description="Valor esperado para activar este camino")


class OrganiflowEdge(BaseModel):
    """Conector entre dos nodos del workflow."""

    id: Optional[str] = Field(
        default=None,
        description="ID del conector (autogenerado si no se proporciona)",
    )
    source_id: str = Field(alias="sourceId", description="ID del nodo origen")
    target_id: str = Field(alias="targetId", description="ID del nodo destino")
    relation_type: EdgeRelationType = Field(
        default="SEQUENTIAL",
        alias="relationType",
        description="Tipo de relación entre nodos",
    )
    source_handle: Optional[str] = Field(
        default=None,
        alias="sourceHandle",
        description="Puerto o lado de salida del nodo origen (ej: 'left', 'right')",
    )
    condition_rule: Optional[ConditionRule] = Field(
        default=None,
        alias="conditionRule",
        description="Regla de condición para edges de tipo CONDITIONAL",
    )

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Mutaciones de workflow
# ---------------------------------------------------------------------------

MutationAction = Literal[
    "ADD_NODE", "UPDATE_NODE", "DELETE_NODE",
    "ADD_EDGE", "UPDATE_EDGE", "DELETE_EDGE",
    "ADD_LANE", "UPDATE_LANE", "DELETE_LANE",
]


class WorkflowMutation(BaseModel):
    """Operación atómica de modificación del diagrama."""

    action: MutationAction = Field(description="Tipo de mutación a aplicar")
    target_id: Optional[str] = Field(
        default=None,
        description="ID del elemento a modificar/eliminar (requerido para UPDATE y DELETE)",
    )
    node_data: Optional[OrganiflowNode] = Field(
        default=None,
        description="Datos del nodo (requerido para ADD_NODE)",
    )
    edge_data: Optional[OrganiflowEdge] = Field(
        default=None,
        description="Datos del conector (requerido para ADD_EDGE)",
    )
    lane_data: Optional[OrganiflowLane] = Field(
        default=None,
        description="Datos del carril (requerido para ADD_LANE)",
    )


class MutationPlan(BaseModel):
    """Plan completo de mutaciones generado por la IA."""

    razonamiento: str = Field(
        description="Explicación breve de las acciones que se van a tomar"
    )
    mutations: List[WorkflowMutation] = Field(
        description="Lista ordenada de mutaciones a aplicar"
    )


# ---------------------------------------------------------------------------
# Request/Response para el endpoint de mutaciones
# ---------------------------------------------------------------------------

class EditRequest(BaseModel):
    """Payload del cliente para solicitar mutaciones de workflow."""

    prompt: str = Field(description="Instrucción en lenguaje natural del usuario")
    current_nodes: List[dict[str, Any]] = Field(
        description="Estado actual de los nodos del diagrama"
    )
    current_edges: List[dict[str, Any]] = Field(
        description="Estado actual de los conectores del diagrama"
    )
    current_lanes: List[dict[str, Any]] = Field(
        default_factory=list,
        description="Estado actual de los carriles del diagrama",
    )
    available_departments: List[dict[str, Any]] = Field(
        default_factory=list,
        description="Departamentos registrados en la BD disponibles para crear carriles",
    )


# ---------------------------------------------------------------------------
# Modelos de análisis de workflow
# ---------------------------------------------------------------------------

class LogicError(BaseModel):
    """Error lógico detectado en el workflow."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    severity: ErrorSeverity = Field(description="Severidad del error")
    node_id: Optional[str] = Field(
        default=None,
        description="ID del nodo involucrado (si aplica)",
    )
    edge_id: Optional[str] = Field(
        default=None,
        description="ID del conector involucrado (si aplica)",
    )
    message: str = Field(description="Descripción del error encontrado")
    suggestion: str = Field(description="Sugerencia para corregir el error")


class Bottleneck(BaseModel):
    """Cuello de botella detectado en el workflow."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    node_id: str = Field(description="ID del nodo que representa el cuello de botella")
    node_name: Optional[str] = Field(
        default=None,
        description="Nombre del nodo para facilitar la identificación",
    )
    reason: str = Field(description="Razón por la que se considera un cuello de botella")
    suggestion: str = Field(description="Sugerencia para mitigar el cuello de botella")


class WorkflowAnalysisRequest(BaseModel):
    """Payload para el endpoint de análisis de workflow."""

    nodes: List[dict[str, Any]] = Field(description="Nodos del diagrama")
    edges: List[dict[str, Any]] = Field(description="Conectores del diagrama")
    lanes: List[dict[str, Any]] = Field(
        default_factory=list,
        description="Carriles del diagrama",
    )


class WorkflowAnalysisResponse(BaseModel):
    """Resultado del análisis lógico del workflow."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    logic_errors: List[LogicError] = Field(
        default_factory=list,
        description="Errores lógicos detectados según reglas UML",
    )
    bottlenecks: List[Bottleneck] = Field(
        default_factory=list,
        description="Cuellos de botella detectados",
    )
    summary: str = Field(
        description="Resumen en lenguaje natural del estado del workflow"
    )
    is_valid: bool = Field(
        description="True si no hay errores de severidad ERROR"
    )


# ---------------------------------------------------------------------------
# Modelos para generación de esquema de nodo
# ---------------------------------------------------------------------------

class NodeSchemaRequest(BaseModel):
    """Payload para solicitar la generación de un FormSchema vía IA."""

    node_type: NodeType = Field(description="Tipo de nodo para el que generar el esquema")
    context: str = Field(
        description="Descripción del proceso de negocio o del nodo (p.ej. 'Revisión de crédito')"
    )
    department_name: Optional[str] = Field(
        default=None,
        description="Nombre del departamento actualmente seleccionado (para contextualizar los campos)",
    )
    language: str = Field(
        default="es",
        description="Idioma para los labels del formulario (es/en)",
    )
    voice_transcript: Optional[str] = Field(
        default=None,
        description=(
            "Transcripción de voz del usuario describiendo el formulario deseado. "
            "Cuando está presente, tiene prioridad sobre el campo 'context' para "
            "determinar qué campos generar."
        ),
    )
    available_departments: List[dict[str, Any]] = Field(
        default_factory=list,
        description="Lista de departamentos registrados en la BD ({id, name}) para sugerir asignación",
    )


class NodeSchemaResponse(BaseModel):
    """Esquema de formulario generado por IA para un nodo."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    form_schema: FormSchema = Field(
        description="Esquema de formulario generado y listo para usar en el node-panel"
    )
    reasoning: str = Field(
        description="Justificación de los campos elegidos y del departamento sugerido"
    )
    suggested_department_id: Optional[str] = Field(
        default=None,
        description="ID del departamento más adecuado para este nodo, tomado de available_departments",
    )


# ---------------------------------------------------------------------------
# Modelos para relleno de formulario por voz
# ---------------------------------------------------------------------------

class FillFormRequest(BaseModel):
    """Payload para solicitar el relleno de un formulario a partir de un transcript de voz."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    transcript: str = Field(
        description="Texto transcrito de lo que dijo el funcionario"
    )
    form_schema: FormSchema = Field(
        description="Esquema del formulario con los campos ya definidos"
    )
    language: str = Field(
        default="es",
        description="Idioma del transcript y de las opciones (es/en)",
    )


class FillFormResponse(BaseModel):
    """Valores extraídos del transcript para cada campo del formulario."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    fields: dict[str, Any] = Field(
        description="Mapa de nombre_de_campo → valor extraído del transcript"
    )
    unfillable_fields: list[str] = Field(
        default_factory=list,
        description="Campos cuyos valores no pudieron determinarse a partir del transcript",
    )
