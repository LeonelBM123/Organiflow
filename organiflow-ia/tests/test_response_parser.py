"""Tests unitarios para el módulo core/response_parser.py."""
from __future__ import annotations

import pytest

from core.response_parser import parse_json_response


class TestParseJsonResponse:
    def test_json_limpio_se_retorna_sin_cambios(self) -> None:
        raw = '{"key": "value"}'
        assert parse_json_response(raw) == '{"key": "value"}'

    def test_extrae_json_de_fence_con_lenguaje(self) -> None:
        raw = "```json\n{\"key\": \"value\"}\n```"
        assert parse_json_response(raw) == '{"key": "value"}'

    def test_extrae_json_de_fence_sin_lenguaje(self) -> None:
        raw = "```\n{\"key\": \"value\"}\n```"
        assert parse_json_response(raw) == '{"key": "value"}'

    def test_extrae_json_de_fence_con_espacios_extra(self) -> None:
        raw = "```json  \n  {\"a\": 1}  \n```"
        assert parse_json_response(raw) == '{"a": 1}'

    def test_elimina_espacios_laterales_en_json_limpio(self) -> None:
        raw = "   {\"x\": true}   "
        assert parse_json_response(raw) == '{"x": true}'

    def test_json_multilínea_se_preserva(self) -> None:
        raw = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```'
        result = parse_json_response(raw)
        assert '"a": 1' in result
        assert '"b": 2' in result

    def test_texto_mixto_retorna_primer_bloque(self) -> None:
        raw = "Aquí está la respuesta:\n```json\n{\"ok\": true}\n```\nEspero que ayude."
        assert parse_json_response(raw) == '{"ok": true}'

    def test_sin_fence_retorna_texto_limpio(self) -> None:
        raw = "  no es json  "
        assert parse_json_response(raw) == "no es json"

    def test_cadena_vacia_retorna_vacia(self) -> None:
        assert parse_json_response("") == ""

    def test_fence_mayusculas_json(self) -> None:
        raw = "```JSON\n{\"upper\": true}\n```"
        assert parse_json_response(raw) == '{"upper": true}'
