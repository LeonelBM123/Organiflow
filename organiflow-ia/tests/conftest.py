"""Fixtures compartidos para los tests de Organiflow IA."""
import pytest


# ---------------------------------------------------------------------------
# Fixtures de workflow de ejemplo
# ---------------------------------------------------------------------------

@pytest.fixture
def simple_workflow() -> dict:
    """Workflow mínimo válido: START → TASK → END."""
    nodes = [
        {"id": "node-start", "type": "START", "name": "Inicio", "laneId": "lane-1"},
        {"id": "node-task", "type": "TASK", "name": "Revisión", "laneId": "lane-1"},
        {"id": "node-end", "type": "END", "name": "Fin", "laneId": "lane-1"},
    ]
    edges = [
        {"id": "e1", "sourceId": "node-start", "targetId": "node-task", "relationType": "SEQUENTIAL"},
        {"id": "e2", "sourceId": "node-task", "targetId": "node-end", "relationType": "SEQUENTIAL"},
    ]
    lanes = [{"id": "lane-1", "name": "Operaciones"}]
    return {"nodes": nodes, "edges": edges, "lanes": lanes}


@pytest.fixture
def orphan_workflow() -> dict:
    """Workflow con un nodo huérfano (sin edges)."""
    nodes = [
        {"id": "node-start", "type": "START", "name": "Inicio", "laneId": "lane-1"},
        {"id": "node-task", "type": "TASK", "name": "Revisión", "laneId": "lane-1"},
        {"id": "node-orphan", "type": "TASK", "name": "Huérfano", "laneId": "lane-1"},
        {"id": "node-end", "type": "END", "name": "Fin", "laneId": "lane-1"},
    ]
    edges = [
        {"id": "e1", "sourceId": "node-start", "targetId": "node-task", "relationType": "SEQUENTIAL"},
        {"id": "e2", "sourceId": "node-task", "targetId": "node-end", "relationType": "SEQUENTIAL"},
    ]
    lanes = [{"id": "lane-1", "name": "Operaciones"}]
    return {"nodes": nodes, "edges": edges, "lanes": lanes}


@pytest.fixture
def duplicate_start_workflow() -> dict:
    """Workflow con dos nodos START."""
    nodes = [
        {"id": "node-start-1", "type": "START", "name": "Inicio 1", "laneId": "lane-1"},
        {"id": "node-start-2", "type": "START", "name": "Inicio 2", "laneId": "lane-1"},
        {"id": "node-end", "type": "END", "name": "Fin", "laneId": "lane-1"},
    ]
    edges = [
        {"id": "e1", "sourceId": "node-start-1", "targetId": "node-end", "relationType": "SEQUENTIAL"},
        {"id": "e2", "sourceId": "node-start-2", "targetId": "node-end", "relationType": "SEQUENTIAL"},
    ]
    lanes = [{"id": "lane-1", "name": "Operaciones"}]
    return {"nodes": nodes, "edges": edges, "lanes": lanes}


@pytest.fixture
def condition_one_exit_workflow() -> dict:
    """Workflow con CONDITION que solo tiene 1 edge saliente."""
    nodes = [
        {"id": "node-start", "type": "START", "name": "Inicio", "laneId": "lane-1"},
        {"id": "node-cond", "type": "CONDITION", "name": "Decisión", "laneId": "lane-1"},
        {"id": "node-end", "type": "END", "name": "Fin", "laneId": "lane-1"},
    ]
    edges = [
        {"id": "e1", "sourceId": "node-start", "targetId": "node-cond", "relationType": "SEQUENTIAL"},
        {"id": "e2", "sourceId": "node-cond", "targetId": "node-end", "relationType": "CONDITIONAL"},
    ]
    lanes = [{"id": "lane-1", "name": "Operaciones"}]
    return {"nodes": nodes, "edges": edges, "lanes": lanes}


@pytest.fixture
def bottleneck_workflow() -> dict:
    """Workflow con un nodo que recibe 4 edges (cuello de botella)."""
    nodes = [
        {"id": "node-start", "type": "START", "name": "Inicio", "laneId": "lane-1"},
        {"id": "node-a", "type": "TASK", "name": "Tarea A", "laneId": "lane-1"},
        {"id": "node-b", "type": "TASK", "name": "Tarea B", "laneId": "lane-1"},
        {"id": "node-c", "type": "TASK", "name": "Tarea C", "laneId": "lane-1"},
        {"id": "node-d", "type": "TASK", "name": "Tarea D", "laneId": "lane-1"},
        {"id": "node-merge", "type": "MERGE", "name": "Unión", "laneId": "lane-1"},
        {"id": "node-end", "type": "END", "name": "Fin", "laneId": "lane-1"},
    ]
    edges = [
        {"id": "e1", "sourceId": "node-start", "targetId": "node-a", "relationType": "SEQUENTIAL"},
        {"id": "e2", "sourceId": "node-start", "targetId": "node-b", "relationType": "SEQUENTIAL"},
        {"id": "e3", "sourceId": "node-start", "targetId": "node-c", "relationType": "SEQUENTIAL"},
        {"id": "e4", "sourceId": "node-start", "targetId": "node-d", "relationType": "SEQUENTIAL"},
        {"id": "e5", "sourceId": "node-a", "targetId": "node-merge", "relationType": "MERGE"},
        {"id": "e6", "sourceId": "node-b", "targetId": "node-merge", "relationType": "MERGE"},
        {"id": "e7", "sourceId": "node-c", "targetId": "node-merge", "relationType": "MERGE"},
        {"id": "e8", "sourceId": "node-d", "targetId": "node-merge", "relationType": "MERGE"},
        {"id": "e9", "sourceId": "node-merge", "targetId": "node-end", "relationType": "SEQUENTIAL"},
    ]
    lanes = [{"id": "lane-1", "name": "Operaciones"}]
    return {"nodes": nodes, "edges": edges, "lanes": lanes}
