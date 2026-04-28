"""
Servicio de análisis lógico de workflows.

Responsabilidad única: detectar errores lógicos (según reglas UML de diagramas
de actividades) y cuellos de botella en un workflow, sin necesidad de llamar al LLM.
El análisis es determinístico y basado en grafos.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from models import (
    Bottleneck,
    LogicError,
    WorkflowAnalysisResponse,
)


class AnalyzerService:
    """Analiza un workflow y detecta errores lógicos y cuellos de botella."""

    def analyze(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        lanes: list[dict[str, Any]],
    ) -> WorkflowAnalysisResponse:
        """Ejecuta el análisis completo del workflow.

        Args:
            nodes: Lista de nodos del diagrama (dicts con al menos 'id' y 'type').
            edges: Lista de conectores (dicts con 'sourceId', 'targetId').
            lanes: Lista de carriles (dicts con 'id' y 'name').

        Returns:
            WorkflowAnalysisResponse con los errores, cuellos de botella y resumen.
        """
        logic_errors = self._detect_logic_errors(nodes, edges)
        bottlenecks = self._detect_bottlenecks(nodes, edges, lanes)

        has_errors = any(e.severity == "ERROR" for e in logic_errors)
        summary = self._build_summary(nodes, edges, logic_errors, bottlenecks)

        return WorkflowAnalysisResponse(
            logic_errors=logic_errors,
            bottlenecks=bottlenecks,
            summary=summary,
            is_valid=not has_errors,
        )

    # ------------------------------------------------------------------
    # Detección de errores lógicos
    # ------------------------------------------------------------------

    def _detect_logic_errors(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
    ) -> list[LogicError]:
        errors: list[LogicError] = []

        # Construir índices de conectividad
        outgoing: dict[str, list[str]] = defaultdict(list)  # nodeId → [targetId, ...]
        incoming: dict[str, list[str]] = defaultdict(list)  # nodeId → [sourceId, ...]

        for edge in edges:
            src = edge.get("sourceId", "")
            tgt = edge.get("targetId", "")
            if src:
                outgoing[src].append(tgt)
            if tgt:
                incoming[tgt].append(src)

        node_ids = {n.get("id", "") for n in nodes}
        nodes_by_type: dict[str, list[dict]] = defaultdict(list)
        for node in nodes:
            nodes_by_type[node.get("type", "TASK")].append(node)

        # 1. Sin nodo START
        if not nodes_by_type["START"]:
            errors.append(LogicError(
                severity="ERROR",
                message="El workflow no tiene ningún nodo de tipo START.",
                suggestion="Añade un nodo START para definir el punto de entrada del flujo.",
            ))

        # 2. START duplicado
        if len(nodes_by_type["START"]) > 1:
            for node in nodes_by_type["START"][1:]:
                errors.append(LogicError(
                    severity="ERROR",
                    node_id=node.get("id"),
                    message=f"Nodo START duplicado: '{node.get('name', node.get('id'))}'.",
                    suggestion="Un workflow UML solo puede tener un único nodo START. Elimina el duplicado.",
                ))

        # 3. Sin nodo END
        if not nodes_by_type["END"]:
            errors.append(LogicError(
                severity="ERROR",
                message="El workflow no tiene ningún nodo de tipo END.",
                suggestion="Añade un nodo END para definir el punto de terminación del flujo.",
            ))

        # 4. END duplicado
        if len(nodes_by_type["END"]) > 1:
            for node in nodes_by_type["END"][1:]:
                errors.append(LogicError(
                    severity="ERROR",
                    node_id=node.get("id"),
                    message=f"Nodo END duplicado: '{node.get('name', node.get('id'))}'.",
                    suggestion="Un workflow UML solo puede tener un único nodo END. Elimina el duplicado.",
                ))

        for node in nodes:
            nid = node.get("id", "")
            ntype = node.get("type", "TASK")
            nname = node.get("name") or nid
            n_out = outgoing.get(nid, [])
            n_in = incoming.get(nid, [])

            # 5. Nodo huérfano (sin edges) — excluir START y END de este chequeo
            if ntype not in ("START", "END") and not n_out and not n_in:
                errors.append(LogicError(
                    severity="ERROR",
                    node_id=nid,
                    message=f"Nodo huérfano detectado: '{nname}' no tiene ningún conector.",
                    suggestion=f"Conecta '{nname}' al flujo principal añadiendo las edges necesarias.",
                ))

            # 6. CONDITION sin ≥2 edges salientes
            if ntype == "CONDITION" and len(n_out) < 2:
                errors.append(LogicError(
                    severity="ERROR",
                    node_id=nid,
                    message=(
                        f"Nodo CONDITION '{nname}' tiene {len(n_out)} edge(s) saliente(s). "
                        "Debe tener al menos 2."
                    ),
                    suggestion=(
                        "Añade al menos 2 conectores salientes al nodo de decisión, "
                        "uno por cada rama del condicional."
                    ),
                ))

            # 7. MERGE sin ≥2 edges entrantes
            if ntype == "MERGE" and len(n_in) < 2:
                errors.append(LogicError(
                    severity="ERROR",
                    node_id=nid,
                    message=(
                        f"Nodo MERGE '{nname}' tiene {len(n_in)} edge(s) entrante(s). "
                        "Debe tener al menos 2."
                    ),
                    suggestion=(
                        "Un nodo MERGE debe reunir al menos 2 ramas paralelas. "
                        "Añade los conectores entrantes faltantes."
                    ),
                ))

            # 8. MERGE después de split XOR (CONDITION) — semánticamente incorrecto
            if ntype == "MERGE" and len(n_in) >= 2:
                # Construir mapa de hijos directos de nodos CONDITION
                condition_ids = {n.get("id", "") for n in nodes_by_type.get("CONDITION", [])}
                # Para cada nodo CONDITION, obtener sus hijos directos
                condition_children: dict[str, set[str]] = {}
                for edge in edges:
                    src = edge.get("sourceId", "")
                    tgt = edge.get("targetId", "")
                    if src in condition_ids:
                        condition_children.setdefault(src, set()).add(tgt)
                # Verificar si todos los padres del MERGE son hijos del mismo CONDITION
                for cond_id, children in condition_children.items():
                    incoming_set = set(n_in)
                    if incoming_set and incoming_set.issubset(children):
                        cond_node = next(
                            (n for n in nodes if n.get("id") == cond_id), {}
                        )
                        cond_name = cond_node.get("name") or cond_id
                        errors.append(LogicError(
                            severity="WARNING",
                            node_id=nid,
                            message=(
                                f"MERGE incorrecto: el nodo MERGE '{nname}' recibe ramas "
                                f"del CONDITION '{cond_name}' (XOR). Las ramas de un "
                                "CONDITION son mutuamente exclusivas; solo una se ejecuta, "
                                "por lo que no hay nada que sincronizar con un MERGE."
                            ),
                            suggestion=(
                                f"Elimina el nodo MERGE '{nname}' y conecta cada rama "
                                "directamente al nodo siguiente común (TASK o END)."
                            ),
                        ))
                        break

            # 10. START sin edge saliente (WARNING)
            if ntype == "START" and not n_out:
                errors.append(LogicError(
                    severity="WARNING",
                    node_id=nid,
                    message=f"El nodo START '{nname}' no tiene ningún conector saliente.",
                    suggestion="Conecta el nodo START al primer paso del workflow.",
                ))

            # 11. END con edges salientes (WARNING)
            if ntype == "END" and n_out:
                errors.append(LogicError(
                    severity="WARNING",
                    node_id=nid,
                    message=f"El nodo END '{nname}' tiene {len(n_out)} conector(es) saliente(s).",
                    suggestion="El nodo END es el punto final del flujo; no debería tener conectores salientes.",
                ))

        # 10. Ciclos sin ITERATOR (detección simplificada con DFS)
        cycle_nodes = self._find_cycle_nodes_without_iterator(nodes, edges, nodes_by_type)
        for nid in cycle_nodes:
            node = next((n for n in nodes if n.get("id") == nid), {})
            nname = node.get("name") or nid
            errors.append(LogicError(
                severity="WARNING",
                node_id=nid,
                message=f"El nodo '{nname}' forma parte de un ciclo sin un nodo ITERATOR.",
                suggestion=(
                    "Si el ciclo es intencional, añade un nodo ITERATOR para representarlo "
                    "correctamente según UML. Si no, elimina el conector que crea el ciclo."
                ),
            ))

        return errors

    def _find_cycle_nodes_without_iterator(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        nodes_by_type: dict[str, list[dict]],
    ) -> list[str]:
        """Detecta nodos que forman ciclos sin pasar por un nodo ITERATOR."""
        # IDs de nodos ITERATOR (los ciclos que pasan por ellos son válidos)
        iterator_ids = {n.get("id", "") for n in nodes_by_type.get("ITERATOR", [])}

        # Construir grafo de adyacencia
        adj: dict[str, list[str]] = defaultdict(list)
        for edge in edges:
            src = edge.get("sourceId", "")
            tgt = edge.get("targetId", "")
            if src and tgt:
                adj[src].append(tgt)

        all_ids = [n.get("id", "") for n in nodes]
        visited: set[str] = set()
        rec_stack: set[str] = set()
        cycle_nodes: set[str] = set()

        def dfs(node_id: str, path: list[str]) -> None:
            visited.add(node_id)
            rec_stack.add(node_id)

            for neighbor in adj.get(node_id, []):
                if neighbor not in visited:
                    dfs(neighbor, path + [neighbor])
                elif neighbor in rec_stack:
                    # Ciclo detectado — verificar si pasa por un ITERATOR
                    cycle_segment = path[path.index(neighbor):] if neighbor in path else []
                    has_iterator = any(nid in iterator_ids for nid in cycle_segment)
                    if not has_iterator and neighbor not in iterator_ids:
                        # Reportar solo el nodo que cierra el ciclo
                        cycle_nodes.add(neighbor)

            rec_stack.discard(node_id)

        for nid in all_ids:
            if nid not in visited:
                dfs(nid, [nid])

        return list(cycle_nodes)

    # ------------------------------------------------------------------
    # Detección de cuellos de botella
    # ------------------------------------------------------------------

    def _detect_bottlenecks(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        lanes: list[dict[str, Any]],
    ) -> list[Bottleneck]:
        bottlenecks: list[Bottleneck] = []
        total_nodes = len(nodes)

        # Índice de edges entrantes por nodo
        incoming_count: dict[str, int] = defaultdict(int)
        for edge in edges:
            tgt = edge.get("targetId", "")
            if tgt:
                incoming_count[tgt] += 1

        for node in nodes:
            nid = node.get("id", "")
            nname = node.get("name") or nid
            ntype = node.get("type", "TASK")
            count_in = incoming_count.get(nid, 0)

            # 1. Nodo con ≥4 edges entrantes
            if count_in >= 4:
                bottlenecks.append(Bottleneck(
                    node_id=nid,
                    node_name=nname,
                    reason=(
                        f"El nodo '{nname}' recibe {count_in} flujos de entrada, "
                        "lo que puede generar esperas y contención."
                    ),
                    suggestion=(
                        "Considera dividir la responsabilidad del nodo en sub-tareas "
                        "o añadir recursos adicionales para ese punto del proceso."
                    ),
                ))

            # 2. Nodo TASK sin departamento asignado
            if ntype == "TASK" and not node.get("laneId") and not node.get("departmentId"):
                bottlenecks.append(Bottleneck(
                    node_id=nid,
                    node_name=nname,
                    reason=f"La tarea '{nname}' no tiene departamento ni carril asignado.",
                    suggestion=(
                        "Asigna esta tarea a un carril/departamento para definir "
                        "quién es responsable de ejecutarla."
                    ),
                ))

        # 3. Carriles con >80% de los nodos
        if total_nodes > 0 and lanes:
            lane_node_count: dict[str, int] = defaultdict(int)
            for node in nodes:
                lane_id = node.get("laneId") or node.get("lane_id")
                if lane_id:
                    lane_node_count[lane_id] += 1

            lane_names = {lane.get("id", ""): lane.get("name", "") for lane in lanes}

            for lane_id, count in lane_node_count.items():
                ratio = count / total_nodes
                if ratio > 0.80 and total_nodes > 2 and len(lanes) > 1:
                    lane_name = lane_names.get(lane_id, lane_id)
                    bottlenecks.append(Bottleneck(
                        node_id=lane_id,
                        node_name=lane_name,
                        reason=(
                            f"El carril '{lane_name}' concentra {count} de {total_nodes} nodos "
                            f"({ratio:.0%} del workflow)."
                        ),
                        suggestion=(
                            "Redistribuye tareas entre otros departamentos para evitar "
                            "sobrecarga en un único equipo."
                        ),
                    ))

        return bottlenecks

    # ------------------------------------------------------------------
    # Generación de resumen
    # ------------------------------------------------------------------

    def _build_summary(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        errors: list[LogicError],
        bottlenecks: list[Bottleneck],
    ) -> str:
        error_count = sum(1 for e in errors if e.severity == "ERROR")
        warning_count = sum(1 for e in errors if e.severity == "WARNING")
        bn_count = len(bottlenecks)

        parts = [
            f"El workflow tiene {len(nodes)} nodo(s) y {len(edges)} conector(es)."
        ]

        if error_count == 0 and warning_count == 0 and bn_count == 0:
            parts.append("El diagrama está correctamente estructurado según las reglas UML.")
        else:
            if error_count:
                parts.append(
                    f"Se detectaron {error_count} error(es) crítico(s) que impiden la correcta "
                    "ejecución del workflow."
                )
            if warning_count:
                parts.append(
                    f"Hay {warning_count} advertencia(s) que deberían revisarse."
                )
            if bn_count:
                parts.append(
                    f"Se identificaron {bn_count} posible(s) cuello(s) de botella en el proceso."
                )

        return " ".join(parts)
