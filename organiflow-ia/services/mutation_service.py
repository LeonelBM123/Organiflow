"""
Servicio de generación de mutaciones de workflow.

Responsabilidad única: orquestar la llamada al LLM para obtener un plan de
mutaciones a partir de un prompt del usuario y el estado actual del diagrama.
"""
from __future__ import annotations

import json
from typing import Any

from core.llm_client import get_client
from core.prompt_builder import PromptBuilder
from core.response_parser import parse_json_response
from models import MutationPlan

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
    ) -> MutationPlan:
        """Genera un plan de mutaciones para el diagrama a partir del prompt del usuario.

        Args:
            prompt: Instrucción en lenguaje natural del usuario.
            nodes: Estado actual de los nodos del diagrama.
            edges: Estado actual de los conectores del diagrama.
            lanes: Estado actual de los carriles del diagrama.

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
        return MutationPlan.model_validate_json(clean_json)
