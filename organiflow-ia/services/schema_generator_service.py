"""
Servicio de generación de esquemas de formulario para nodos.

Responsabilidad única: usar el LLM para generar un FormSchema relevante
para un nodo dado el contexto del proceso de negocio y el departamento responsable.
"""
from __future__ import annotations

import json

from core.llm_client import get_client
from core.prompt_builder import PromptBuilder
from core.response_parser import parse_json_response
from models import NodeSchemaRequest, NodeSchemaResponse

_MODEL = "anthropic/claude-haiku-4.5"
_TEMPERATURE = 0.3  # Algo más creativo que mutaciones, pero controlado


class SchemaGeneratorService:
    """Genera esquemas de formulario para nodos de workflow usando el LLM."""

    async def generate_schema(self, request: NodeSchemaRequest) -> NodeSchemaResponse:
        """Genera un FormSchema para el nodo descrito en la petición.

        Args:
            request: Payload con tipo de nodo, contexto y departamento.

        Returns:
            NodeSchemaResponse con el FormSchema generado y la justificación.

        Raises:
            ValueError: Si la respuesta del LLM no es JSON válido o no cumple el schema.
        """
        client = get_client()

        dept_info = (
            f" El departamento actualmente seleccionado es: {request.department_name}."
            if request.department_name
            else ""
        )

        voice_section = (
            f"\n\nINSTRUCCIÓN DE VOZ DEL USUARIO:\n{request.voice_transcript}"
            if request.voice_transcript
            else ""
        )

        departments_section = (
            f"\n\nDEPARTAMENTOS DISPONIBLES EN LA BD:\n{json.dumps(request.available_departments, ensure_ascii=False)}"
            if request.available_departments
            else ""
        )

        user_message = (
            f"Tipo de nodo: {request.node_type}\n"
            f"Contexto del proceso: {request.context}{dept_info}\n"
            f"Idioma para los labels: {request.language}"
            f"{departments_section}"
            f"{voice_section}"
        )

        response = await client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": PromptBuilder.build_schema_system()},
                {"role": "user", "content": user_message},
            ],
            temperature=_TEMPERATURE,
        )

        raw = response.choices[0].message.content or ""
        clean_json = parse_json_response(raw)
        return NodeSchemaResponse.model_validate_json(clean_json)
