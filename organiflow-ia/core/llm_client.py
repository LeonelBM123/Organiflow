"""
Módulo de cliente LLM para Organiflow IA.

Responsabilidad única: proveer una instancia singleton del cliente AsyncOpenAI
configurado para usar OpenRouter, cargando credenciales desde variables de entorno.
"""
from __future__ import annotations

import functools
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


@functools.lru_cache(maxsize=1)
def get_client() -> AsyncOpenAI:
    """Retorna la instancia singleton del cliente AsyncOpenAI para OpenRouter.

    Raises:
        RuntimeError: Si la variable de entorno OPENROUTER_API_KEY no está definida.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "La variable de entorno OPENROUTER_API_KEY no está configurada. "
            "Añádela al archivo .env antes de iniciar el servicio."
        )
    return AsyncOpenAI(base_url=_OPENROUTER_BASE_URL, api_key=api_key)
