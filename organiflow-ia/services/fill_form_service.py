"""
Servicio de relleno de formulario por voz para funcionarios.

Responsabilidad única: dado un transcript de voz y el esquema del formulario,
usar el LLM para extraer los valores correspondientes a cada campo.
"""
from __future__ import annotations

from core.llm_client import get_client
from core.prompt_builder import PromptBuilder
from core.response_parser import parse_json_response
from models import FillFormRequest, FillFormResponse

_MODEL = "anthropic/claude-haiku-4-5"
_TEMPERATURE = 0.1  # Extracción exacta — mínima creatividad


class FillFormService:
    """Extrae valores de formulario a partir de un transcript de voz usando el LLM."""

    async def fill(self, request: FillFormRequest) -> FillFormResponse:
        """Procesa el transcript y devuelve los valores para cada campo del formulario.

        Args:
            request: Payload con el transcript, el esquema del formulario y el idioma.

        Returns:
            FillFormResponse con el mapa campo→valor y los campos no resolubles.

        Raises:
            ValueError: Si la respuesta del LLM no es JSON válido.
        """
        client = get_client()

        user_message = (
            f'TRANSCRIPT DEL FUNCIONARIO:\n"{request.transcript}"\n\n'
            f"ESQUEMA DEL FORMULARIO:\n{request.form_schema.model_dump_json(by_alias=True)}\n\n"
            f"Idioma: {request.language}"
        )

        response = await client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": PromptBuilder.build_fill_form_system()},
                {"role": "user", "content": user_message},
            ],
            temperature=_TEMPERATURE,
        )

        raw = response.choices[0].message.content or "{}"
        clean_json = parse_json_response(raw)
        return FillFormResponse.model_validate_json(clean_json)
