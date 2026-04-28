"""
Servicio de generación de mutaciones de workflow.

Responsabilidad única: orquestar la llamada al LLM para obtener un plan de
mutaciones a partir de un prompt del usuario y el estado actual del diagrama.
"""
from __future__ import annotations

import json
import uuid
from typing import Any

from core.llm_client import get_client
from core.prompt_builder import PromptBuilder
from core.response_parser import parse_json_response
from models import MutationPlan, OrganiflowEdge, OrganiflowNode, WorkflowMutation

_MODEL = "anthropic/claude-haiku-4.5"
_TEMPERATURE = 0.1


class MutationService:
    """Genera planes de mutación de workflow usando el LLM."""

    async def generate_mutations(
        self,
        prompt: str,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        lanes: list[dict[str, Any]],
        available_departments: list[dict[str, Any]] | None = None,
    ) -> MutationPlan:
        """Genera un plan de mutaciones para el diagrama a partir del prompt del usuario.

        Args:
            prompt: Instrucción en lenguaje natural del usuario.
            nodes: Estado actual de los nodos del diagrama.
            edges: Estado actual de los conectores del diagrama.
            lanes: Estado actual de los carriles del diagrama.
            available_departments: Departamentos registrados en la BD (únicos válidos para ADD_LANE).

        Returns:
            MutationPlan validado con las mutaciones a aplicar.

        Raises:
            ValueError: Si la respuesta del LLM no es JSON válido o no cumple el schema.
        """
        client = get_client()

        user_context = (
            "ESTADO ACTUAL DEL DIAGRAMA:\n"
            f"Carriles actuales (Departamentos): {json.dumps(lanes, ensure_ascii=False)}\n"
            f"Nodos: {json.dumps(nodes, ensure_ascii=False)}\n"
            f"Conectores: {json.dumps(edges, ensure_ascii=False)}\n\n"
            f"DEPARTAMENTOS DISPONIBLES EN LA BD: {json.dumps(available_departments or [], ensure_ascii=False)}\n\n"
            f"PETICIÓN DEL USUARIO: {prompt}"
        )

        response = await client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": PromptBuilder.build_mutation_system()},
                {"role": "user", "content": user_context},
            ],
            temperature=_TEMPERATURE,
        )

        raw = response.choices[0].message.content or ""
        clean_json = parse_json_response(raw)
        plan = MutationPlan.model_validate_json(clean_json)
        return self._ensure_condition_two_exits(plan, nodes)

    # ------------------------------------------------------------------
    # Post-processing: safety net for CONDITION nodes
    # ------------------------------------------------------------------

    def _ensure_condition_two_exits(
        self,
        plan: MutationPlan,
        existing_nodes: list[dict[str, Any]],
    ) -> MutationPlan:
        """Ensures every new CONDITION node in the plan has exactly 2 outgoing edges.

        If the LLM only generated 1 outgoing edge for a CONDITION, this method
        automatically appends a second edge pointing to the END node. If no END
        node exists (neither in the existing diagram nor in the plan's ADD_NODE
        mutations), a new END node is created first.
        """
        mutations = plan.mutations

        # Collect IDs of CONDITION nodes being added in this plan
        new_condition_ids: set[str] = {
            m.node_data.id
            for m in mutations
            if m.action == "ADD_NODE"
            and m.node_data is not None
            and m.node_data.type == "CONDITION"
            and m.node_data.id is not None
        }

        if not new_condition_ids:
            return plan

        # Count outgoing edges per CONDITION from ADD_EDGE mutations
        outgoing_count: dict[str, int] = {cid: 0 for cid in new_condition_ids}
        for m in mutations:
            if m.action == "ADD_EDGE" and m.edge_data is not None:
                src = m.edge_data.source_id
                if src in outgoing_count:
                    outgoing_count[src] += 1

        # Find conditions that are missing a second exit
        needs_fix = [cid for cid, count in outgoing_count.items() if count < 2]
        if not needs_fix:
            return plan

        # Resolve the END node ID (existing diagram first, then plan ADD_NODEs)
        end_node_id: str | None = next(
            (n.get("id") for n in existing_nodes if n.get("type") == "END"),
            None,
        )
        if end_node_id is None:
            end_node_id = next(
                (
                    m.node_data.id
                    for m in mutations
                    if m.action == "ADD_NODE"
                    and m.node_data is not None
                    and m.node_data.type == "END"
                    and m.node_data.id is not None
                ),
                None,
            )

        extra_mutations: list[WorkflowMutation] = []

        # Create an END node if none exists at all
        if end_node_id is None:
            end_node_id = f"node-{uuid.uuid4().hex[:8]}"
            extra_mutations.append(
                WorkflowMutation(
                    action="ADD_NODE",
                    node_data=OrganiflowNode(id=end_node_id, type="END", name="Fin"),
                )
            )

        # Append the missing exit edge for each under-connected CONDITION
        for cid in needs_fix:
            extra_mutations.append(
                WorkflowMutation(
                    action="ADD_EDGE",
                    edge_data=OrganiflowEdge(
                        id=f"edge-{uuid.uuid4().hex[:8]}",
                        source_id=cid,
                        target_id=end_node_id,
                        relation_type="CONDITIONAL",
                    ),
                )
            )

        return MutationPlan(
            razonamiento=plan.razonamiento,
            mutations=mutations + extra_mutations,
        )
