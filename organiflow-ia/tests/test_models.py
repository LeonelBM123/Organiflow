"""Tests de validación para los modelos Pydantic de Organiflow IA."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from models import (
    AiConfig,
    EditRequest,
    FormField,
    FormSchema,
    MutationPlan,
    NodeSchemaRequest,
    NodeSchemaResponse,
    OrganiflowEdge,
    OrganiflowLane,
    OrganiflowNode,
    WorkflowAnalysisRequest,
    WorkflowMutation,
)


class TestOrganiflowNode:
    def test_autogenera_id_si_no_se_proporciona(self) -> None:
        node = OrganiflowNode(type="TASK", name="Mi tarea")
        assert node.id is not None
        assert node.id.startswith("node-")

    def test_respeta_id_proporcionado(self) -> None:
        node = OrganiflowNode(id="node-custom", type="TASK", name="Mi tarea")
        assert node.id == "node-custom"

    def test_acepta_alias_laneId(self) -> None:
        node = OrganiflowNode.model_validate({"type": "TASK", "name": "x", "laneId": "lane-1"})
        assert node.lane_id == "lane-1"

    def test_acepta_alias_formSchema_con_campos(self) -> None:
        data = {
            "type": "TASK",
            "name": "Revisión",
            "formSchema": {
                "name": "Formulario de revisión",
                "fields": [
                    {
                        "name": "monto",
                        "label": "Monto",
                        "type": "number",
                        "required": True,
                        "options": [],
                        "sortOrder": 1,
                        "validationRules": {},
                        "visibilityConditions": {},
                    }
                ],
            },
        }
        node = OrganiflowNode.model_validate(data)
        assert node.form_schema is not None
        assert len(node.form_schema.fields) == 1
        assert node.form_schema.fields[0].name == "monto"

    def test_tipo_invalido_lanza_error(self) -> None:
        with pytest.raises(ValidationError):
            OrganiflowNode(type="INVALID_TYPE", name="x")  # type: ignore[arg-type]

    def test_timeout_hours_debe_ser_positivo(self) -> None:
        with pytest.raises(ValidationError):
            OrganiflowNode.model_validate({"type": "TASK", "timeoutHours": 0})


class TestFormField:
    def test_valores_por_defecto(self) -> None:
        field = FormField(name="campo", label="Campo")
        assert field.type == "text"
        assert field.required is False
        assert field.options == []
        assert field.sort_order == 1

    def test_tipo_invalido_lanza_error(self) -> None:
        with pytest.raises(ValidationError):
            FormField(name="x", label="X", type="checkbox")  # type: ignore[arg-type]

    def test_sort_order_debe_ser_mayor_que_cero(self) -> None:
        with pytest.raises(ValidationError):
            FormField.model_validate({"name": "x", "label": "X", "sortOrder": 0})


class TestFormSchema:
    def test_campos_vacios_por_defecto(self) -> None:
        schema = FormSchema(name="Mi formulario")
        assert schema.fields == []

    def test_campos_se_asignan_correctamente(self) -> None:
        schema = FormSchema(
            name="Formulario",
            fields=[FormField(name="a", label="A"), FormField(name="b", label="B")],
        )
        assert len(schema.fields) == 2


class TestAiConfig:
    def test_modelo_por_defecto(self) -> None:
        config = AiConfig(prompt="Resume la solicitud")
        assert config.model == "claude-sonnet-4-6"
        assert config.auto_execute is False

    def test_acepta_alias_autoExecute(self) -> None:
        config = AiConfig.model_validate({"prompt": "Analiza", "autoExecute": True})
        assert config.auto_execute is True


class TestOrganiflowEdge:
    def test_acepta_aliases(self) -> None:
        edge = OrganiflowEdge.model_validate({
            "sourceId": "node-a",
            "targetId": "node-b",
            "relationType": "CONDITIONAL",
        })
        assert edge.source_id == "node-a"
        assert edge.target_id == "node-b"
        assert edge.relation_type == "CONDITIONAL"

    def test_relation_type_invalido_lanza_error(self) -> None:
        with pytest.raises(ValidationError):
            OrganiflowEdge.model_validate({
                "sourceId": "a",
                "targetId": "b",
                "relationType": "UNKNOWN",
            })


class TestWorkflowMutation:
    def test_add_node_mutation(self) -> None:
        mutation = WorkflowMutation(
            action="ADD_NODE",
            node_data=OrganiflowNode(type="TASK", name="Nueva tarea"),
        )
        assert mutation.action == "ADD_NODE"
        assert mutation.node_data is not None

    def test_delete_lane_mutation(self) -> None:
        mutation = WorkflowMutation(action="DELETE_LANE", target_id="lane-1")
        assert mutation.target_id == "lane-1"

    def test_accion_invalida_lanza_error(self) -> None:
        with pytest.raises(ValidationError):
            WorkflowMutation(action="INVALID_ACTION")  # type: ignore[arg-type]


class TestMutationPlan:
    def test_valida_desde_json(self) -> None:
        raw = """
        {
            "razonamiento": "Se añade un nodo de inicio",
            "mutations": [
                {
                    "action": "ADD_NODE",
                    "node_data": {"type": "START", "name": "Inicio", "laneId": "lane-1"}
                }
            ]
        }
        """
        plan = MutationPlan.model_validate_json(raw)
        assert len(plan.mutations) == 1
        assert plan.mutations[0].action == "ADD_NODE"


class TestEditRequest:
    def test_current_lanes_tiene_valor_por_defecto(self) -> None:
        request = EditRequest(
            prompt="Crea un flujo simple",
            current_nodes=[],
            current_edges=[],
        )
        assert request.current_lanes == []


class TestWorkflowAnalysisRequest:
    def test_lanes_tiene_valor_por_defecto(self) -> None:
        req = WorkflowAnalysisRequest(nodes=[], edges=[])
        assert req.lanes == []


class TestNodeSchemaRequest:
    def test_idioma_por_defecto(self) -> None:
        req = NodeSchemaRequest(node_type="TASK", context="Aprobación de crédito")
        assert req.language == "es"
        assert req.department_name is None
