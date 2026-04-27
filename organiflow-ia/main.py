"""
Entry point del microservicio de IA de Organiflow.

Registra los routers, configura CORS desde variables de entorno y
define el ciclo de vida (lifespan) de la aplicación.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analysis, mutations, schema

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s — %(name)s — %(message)s")


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gestiona el ciclo de vida de la aplicación."""
    logger.info("Organiflow IA — iniciando servicio...")
    logger.info("Endpoints registrados:")
    for route in app.routes:
        if hasattr(route, "methods"):
            for method in route.methods:
                logger.info("  %s %s", method, route.path)
    yield
    logger.info("Organiflow IA — servicio detenido.")


# ---------------------------------------------------------------------------
# Configuración de CORS
# ---------------------------------------------------------------------------

def _get_allowed_origins() -> list[str]:
    """Lee los orígenes permitidos desde la variable de entorno CORS_ORIGINS.

    Si no está configurada, usa los valores predeterminados para desarrollo local.
    En producción, configura CORS_ORIGINS con los dominios reales separados por coma.

    Examples:
        CORS_ORIGINS=https://miapp.com,https://www.miapp.com
    """
    raw = os.getenv("CORS_ORIGINS", "")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    # Valores por defecto para desarrollo
    return [
        "http://localhost:4200",   # Angular dev server
        "http://localhost:8080",   # Spring Boot backend
        "http://127.0.0.1:4200",
        "http://127.0.0.1:8080",
    ]


# ---------------------------------------------------------------------------
# Aplicación FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Organiflow AI Assistant",
    description=(
        "Microservicio de IA para generación de mutaciones de workflow, "
        "análisis lógico y generación de esquemas de formulario."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(mutations.router)
app.include_router(analysis.router)
app.include_router(schema.router)
