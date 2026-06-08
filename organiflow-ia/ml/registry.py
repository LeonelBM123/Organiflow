"""Persistencia de artefactos del recomendador, por tenant.

Responsabilidad única: guardar y cargar el modelo entrenado, el mapa de etiquetas
y las métricas de cada tenant. Permite que `/recommend` cargue el último modelo
sin reentrenar y que `/train` lo reemplace.
"""
from __future__ import annotations

import json
from typing import Any

import torch

from ml.classifier import PolicyClassifier
from ml.storage import tenant_dir

_MODEL_FILE = "model.pt"
_LABEL_MAP_FILE = "label_map.json"
_METRICS_FILE = "metrics.json"

LabelMap = dict[str, dict[str, str]]


def save(
    tenant_id: str,
    state_dict: dict[str, torch.Tensor],
    label_map: LabelMap,
    metrics: dict[str, Any],
    input_dim: int,
    num_classes: int,
) -> None:
    """Guarda el modelo entrenado y sus metadatos en el directorio del tenant."""
    directory = tenant_dir(tenant_id, create=True)
    torch.save(
        {"state_dict": state_dict, "input_dim": input_dim, "num_classes": num_classes},
        directory / _MODEL_FILE,
    )
    (directory / _LABEL_MAP_FILE).write_text(
        json.dumps(label_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (directory / _METRICS_FILE).write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def load(tenant_id: str) -> tuple[PolicyClassifier, LabelMap] | None:
    """Carga el modelo entrenado del tenant en modo evaluación.

    Returns:
        Tupla `(model, label_map)` si existe un modelo entrenado; `None` si no.
    """
    directory = tenant_dir(tenant_id)
    model_path = directory / _MODEL_FILE
    label_map_path = directory / _LABEL_MAP_FILE
    if not model_path.exists() or not label_map_path.exists():
        return None

    checkpoint = torch.load(model_path, map_location="cpu", weights_only=True)
    model = PolicyClassifier(
        input_dim=checkpoint["input_dim"], num_classes=checkpoint["num_classes"]
    )
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    label_map: LabelMap = json.loads(label_map_path.read_text(encoding="utf-8"))
    return model, label_map


def load_metrics(tenant_id: str) -> dict[str, Any] | None:
    """Devuelve las métricas guardadas del último entrenamiento, si existen."""
    metrics_path = tenant_dir(tenant_id) / _METRICS_FILE
    if not metrics_path.exists():
        return None
    return json.loads(metrics_path.read_text(encoding="utf-8"))
