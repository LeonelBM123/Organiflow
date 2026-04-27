"""
Módulo de parseo de respuestas LLM para Organiflow IA.

Responsabilidad única: extraer y limpiar el JSON crudo de la respuesta del modelo,
que puede venir envuelto en bloques de código markdown (```json ... ```).
"""
from __future__ import annotations

import re


_MARKDOWN_FENCE_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def parse_json_response(raw: str) -> str:
    """Extrae el contenido JSON de una respuesta que puede contener markdown fences.

    Args:
        raw: Texto crudo retornado por el modelo LLM.

    Returns:
        String con el JSON limpio, listo para ser parseado por Pydantic.

    Examples:
        >>> parse_json_response('```json\\n{"key": "value"}\\n```')
        '{"key": "value"}'
        >>> parse_json_response('{"key": "value"}')
        '{"key": "value"}'
    """
    match = _MARKDOWN_FENCE_RE.search(raw)
    if match:
        return match.group(1).strip()
    return raw.strip()
