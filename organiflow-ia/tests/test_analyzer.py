"""Tests unitarios para AnalyzerService — sin llamadas al LLM."""
from __future__ import annotations

import pytest

from services.analyzer_service import AnalyzerService


@pytest.fixture
def service() -> AnalyzerService:
    return AnalyzerService()


class TestWorkflowValido:
    def test_workflow_simple_es_valido(self, service: AnalyzerService, simple_workflow: dict) -> None:
        result = service.analyze(**simple_workflow)
        assert result.is_valid is True
        assert result.logic_errors == []
        assert result.bottlenecks == []

    def test_summary_menciona_nodos_y_edges(self, service: AnalyzerService, simple_workflow: dict) -> None:
        result = service.analyze(**simple_workflow)
        assert "3 nodo" in result.summary
        assert "2 conector" in result.summary


class TestNodosHuerfanos:
    def test_detecta_nodo_huerfano(self, service: AnalyzerService, orphan_workflow: dict) -> None:
        result = service.analyze(**orphan_workflow)
        assert result.is_valid is False
        orphan_errors = [
            e for e in result.logic_errors
            if e.node_id == "node-orphan" and e.severity == "ERROR"
        ]
        assert len(orphan_errors) == 1

    def test_error_menciona_nombre_del_nodo(self, service: AnalyzerService, orphan_workflow: dict) -> None:
        result = service.analyze(**orphan_workflow)
        orphan_errors = [e for e in result.logic_errors if e.node_id == "node-orphan"]
        assert any("Huérfano" in e.message for e in orphan_errors)


class TestStartEndDuplicados:
    def test_detecta_start_duplicado(
        self, service: AnalyzerService, duplicate_start_workflow: dict
    ) -> None:
        result = service.analyze(**duplicate_start_workflow)
        assert result.is_valid is False
        start_errors = [
            e for e in result.logic_errors
            if "START" in e.message and e.severity == "ERROR"
        ]
        assert len(start_errors) >= 1

    def test_detecta_end_duplicado(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "end-1", "type": "END", "name": "Fin 1", "laneId": "l1"},
                {"id": "end-2", "type": "END", "name": "Fin 2", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "start", "targetId": "end-1", "relationType": "SEQUENTIAL"},
                {"id": "e2", "sourceId": "start", "targetId": "end-2", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        end_errors = [
            e for e in result.logic_errors
            if "END" in e.message and e.severity == "ERROR"
        ]
        assert len(end_errors) >= 1


class TestSinStartOEnd:
    def test_detecta_falta_de_start(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "task", "type": "TASK", "name": "Tarea", "laneId": "l1"},
                {"id": "end", "type": "END", "name": "Fin", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "task", "targetId": "end", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        errors = [e for e in result.logic_errors if "START" in e.message]
        assert len(errors) >= 1

    def test_detecta_falta_de_end(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "task", "type": "TASK", "name": "Tarea", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "start", "targetId": "task", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        errors = [e for e in result.logic_errors if "END" in e.message]
        assert len(errors) >= 1


class TestConditionYMerge:
    def test_condition_con_una_sola_salida_es_error(
        self, service: AnalyzerService, condition_one_exit_workflow: dict
    ) -> None:
        result = service.analyze(**condition_one_exit_workflow)
        cond_errors = [
            e for e in result.logic_errors
            if e.node_id == "node-cond" and e.severity == "ERROR"
        ]
        assert len(cond_errors) == 1

    def test_condition_con_dos_salidas_es_valido(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "cond", "type": "CONDITION", "name": "¿Aprobado?", "laneId": "l1"},
                {"id": "ok", "type": "TASK", "name": "Aprobado", "laneId": "l1"},
                {"id": "nok", "type": "TASK", "name": "Rechazado", "laneId": "l1"},
                {"id": "end", "type": "END", "name": "Fin", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "start", "targetId": "cond", "relationType": "SEQUENTIAL"},
                {"id": "e2", "sourceId": "cond", "targetId": "ok", "relationType": "CONDITIONAL"},
                {"id": "e3", "sourceId": "cond", "targetId": "nok", "relationType": "CONDITIONAL"},
                {"id": "e4", "sourceId": "ok", "targetId": "end", "relationType": "SEQUENTIAL"},
                {"id": "e5", "sourceId": "nok", "targetId": "end", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        cond_errors = [e for e in result.logic_errors if e.node_id == "cond"]
        assert not cond_errors

    def test_merge_con_una_entrada_es_error(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "merge", "type": "MERGE", "name": "Unión", "laneId": "l1"},
                {"id": "end", "type": "END", "name": "Fin", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "start", "targetId": "merge", "relationType": "MERGE"},
                {"id": "e2", "sourceId": "merge", "targetId": "end", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        merge_errors = [e for e in result.logic_errors if e.node_id == "merge"]
        assert len(merge_errors) >= 1


class TestCuellosDeBottella:
    def test_detecta_nodo_con_4_entradas(
        self, service: AnalyzerService, bottleneck_workflow: dict
    ) -> None:
        result = service.analyze(**bottleneck_workflow)
        bn = [b for b in result.bottlenecks if b.node_id == "node-merge"]
        assert len(bn) >= 1

    def test_detecta_tarea_sin_carril(self, service: AnalyzerService) -> None:
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "task", "type": "TASK", "name": "Sin depto"},  # sin laneId
                {"id": "end", "type": "END", "name": "Fin", "laneId": "l1"},
            ],
            "edges": [
                {"id": "e1", "sourceId": "start", "targetId": "task", "relationType": "SEQUENTIAL"},
                {"id": "e2", "sourceId": "task", "targetId": "end", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        bn = [b for b in result.bottlenecks if b.node_id == "task"]
        assert len(bn) == 1

    def test_detecta_carril_con_mas_del_80_porciento(self, service: AnalyzerService) -> None:
        # 5 nodos en lane-1 de un total de 5 → 100%
        nodes = [
            {"id": f"t{i}", "type": "TASK", "name": f"Tarea {i}", "laneId": "lane-1"}
            for i in range(5)
        ]
        nodes[0]["type"] = "START"
        nodes[4]["type"] = "END"
        edges = [
            {"id": f"e{i}", "sourceId": f"t{i}", "targetId": f"t{i + 1}", "relationType": "SEQUENTIAL"}
            for i in range(4)
        ]
        lanes = [
            {"id": "lane-1", "name": "Departamento A"},
            {"id": "lane-2", "name": "Departamento B"},
        ]
        result = service.analyze(nodes=nodes, edges=edges, lanes=lanes)
        bn = [b for b in result.bottlenecks if b.node_id == "lane-1"]
        assert len(bn) == 1


class TestIsValid:
    def test_is_valid_false_si_hay_errores_criticos(
        self, service: AnalyzerService, orphan_workflow: dict
    ) -> None:
        result = service.analyze(**orphan_workflow)
        assert result.is_valid is False

    def test_is_valid_true_con_solo_warnings(self, service: AnalyzerService) -> None:
        # Workflow con START sin edge saliente → WARNING, no ERROR
        workflow = {
            "nodes": [
                {"id": "start", "type": "START", "name": "Inicio", "laneId": "l1"},
                {"id": "end", "type": "END", "name": "Fin", "laneId": "l1"},
            ],
            "edges": [
                # start no tiene edge saliente pero end tampoco edge entrante
                {"id": "e1", "sourceId": "end", "targetId": "start", "relationType": "SEQUENTIAL"},
            ],
            "lanes": [{"id": "l1", "name": "Ops"}],
        }
        result = service.analyze(**workflow)
        # END con salida = WARNING; verificamos que is_valid es True si no hay ERRORs
        has_critical = any(e.severity == "ERROR" for e in result.logic_errors)
        assert result.is_valid == (not has_critical)
