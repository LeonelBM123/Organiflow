"""
Tests unitarios para SchemaGeneratorService.

Usa un cliente LLM mockeado para no consumir tokens en CI.
Verifica que:
  - el user_message se construye correctamente con y sin voice_transcript
  - la respuesta del LLM se parsea y valida correctamente
"""
from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from models import FormField, FormSchema, NodeSchemaRequest, NodeSchemaResponse
from services.schema_generator_service import SchemaGeneratorService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_llm_response(form_schema: dict, reasoning: str = "Test reasoning") -> MagicMock:
    """Construye un mock de la respuesta de la API de OpenAI."""
    content = json.dumps({"form_schema": form_schema, "reasoning": reasoning})
    choice = SimpleNamespace(message=SimpleNamespace(content=content))
    response = MagicMock()
    response.choices = [choice]
    return response


_SIMPLE_SCHEMA = {
    "name": "Formulario de prueba",
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
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def service() -> SchemaGeneratorService:
    return SchemaGeneratorService()


@pytest.fixture()
def mock_client():
    """Mockea get_client() y devuelve el objeto AsyncMock del cliente."""
    client = MagicMock()
    client.chat = MagicMock()
    client.chat.completions = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=_make_llm_response(_SIMPLE_SCHEMA))
    with patch("services.schema_generator_service.get_client", return_value=client):
        yield client


# ---------------------------------------------------------------------------
# Tests: construcción del user_message
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sin_voice_transcript_message_no_contiene_seccion_voz(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """Sin voice_transcript el mensaje al LLM NO debe incluir la sección de voz."""
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Aprobación de crédito",
        department_name="Finanzas",
        language="es",
    )

    await service.generate_schema(request)

    call_args = mock_client.chat.completions.create.call_args
    user_content: str = call_args.kwargs["messages"][1]["content"]

    assert "INSTRUCCIÓN DE VOZ" not in user_content
    assert "Aprobación de crédito" in user_content
    assert "Finanzas" in user_content


@pytest.mark.asyncio
async def test_con_voice_transcript_message_incluye_seccion_voz(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """Con voice_transcript el mensaje al LLM DEBE incluir la sección de voz."""
    transcript = "necesito un campo de monto y uno de fecha de vencimiento"
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Revisión de préstamo",
        language="es",
        voice_transcript=transcript,
    )

    await service.generate_schema(request)

    call_args = mock_client.chat.completions.create.call_args
    user_content: str = call_args.kwargs["messages"][1]["content"]

    assert "INSTRUCCIÓN DE VOZ DEL USUARIO:" in user_content
    assert transcript in user_content


@pytest.mark.asyncio
async def test_sin_department_no_incluye_dept_info(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """Sin department_name el mensaje no debe incluir la línea del departamento."""
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Validación técnica",
        language="es",
    )

    await service.generate_schema(request)

    call_args = mock_client.chat.completions.create.call_args
    user_content: str = call_args.kwargs["messages"][1]["content"]

    assert "departamento" not in user_content.lower()


# ---------------------------------------------------------------------------
# Tests: parseo y validación del response
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_response_valida_correctamente_el_schema(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """La respuesta del LLM debe deserializarse en un NodeSchemaResponse válido."""
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Aprobación",
        language="es",
    )

    result = await service.generate_schema(request)

    assert isinstance(result, NodeSchemaResponse)
    assert isinstance(result.form_schema, FormSchema)
    assert len(result.form_schema.fields) == 1
    assert result.form_schema.fields[0].name == "monto"
    assert result.form_schema.fields[0].type == "number"


@pytest.mark.asyncio
async def test_voice_transcript_vacio_se_trata_como_ausente(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """Un voice_transcript de string vacío no debe añadir la sección de voz."""
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Control de calidad",
        language="es",
        voice_transcript="",
    )

    await service.generate_schema(request)

    call_args = mock_client.chat.completions.create.call_args
    user_content: str = call_args.kwargs["messages"][1]["content"]

    # voice_transcript="" es falsy → no debe aparecer la sección
    assert "INSTRUCCIÓN DE VOZ" not in user_content


@pytest.mark.asyncio
async def test_model_usado_es_haiku(
    service: SchemaGeneratorService, mock_client: MagicMock
) -> None:
    """El servicio debe usar el modelo Haiku (rápido y económico)."""
    request = NodeSchemaRequest(
        node_type="TASK",
        context="Cualquier contexto",
        language="es",
    )

    await service.generate_schema(request)

    call_args = mock_client.chat.completions.create.call_args
    assert "haiku" in call_args.kwargs["model"].lower()
