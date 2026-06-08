"""Rutas de almacenamiento de artefactos del recomendador, por tenant.

Responsabilidad única: resolver (y crear) el directorio donde viven el modelo
entrenado, el mapa de etiquetas, las métricas y el dataset cacheado de cada tenant.

Estructura:
    artifacts/
      {tenantId}/
        model.pt
        label_map.json
        metrics.json
        dataset.jsonl
"""
from __future__ import annotations

import re
from pathlib import Path

# Raíz de artefactos, relativa a la raíz del microservicio organiflow-ia.
ARTIFACTS_ROOT = Path(__file__).resolve().parent.parent / "artifacts"

_SLUG_RE = re.compile(r"[^a-zA-Z0-9_-]+")


def _safe(tenant_id: str) -> str:
    """Sanea el tenant_id para usarlo como nombre de carpeta."""
    cleaned = _SLUG_RE.sub("-", (tenant_id or "default").strip()) or "default"
    return cleaned


def tenant_dir(tenant_id: str, *, create: bool = False) -> Path:
    """Devuelve el directorio de artefactos del tenant.

    Args:
        tenant_id: Identificador del tenant.
        create: Si es True, crea el directorio (y sus padres) si no existe.

    Returns:
        Ruta `Path` al directorio del tenant.
    """
    path = ARTIFACTS_ROOT / _safe(tenant_id)
    if create:
        path.mkdir(parents=True, exist_ok=True)
    return path
