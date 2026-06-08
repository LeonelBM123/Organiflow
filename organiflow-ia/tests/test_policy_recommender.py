"""Tests unitarios del recomendador de políticas (paquete `ml`).

Son rápidos y deterministas: el LLM y el encoder se mockean, de modo que no se
consume red ni se descargan modelos. Cubren:
  - generación del dataset (offline por plantillas y vía LLM mockeado con dedupe),
  - forma de salida del clasificador (`PolicyClassifier.forward`),
  - persistencia (`registry.save`/`load`),
  - inferencia: fallback coseno (cold-start) y mapeo de etiquetas del modelo.
"""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
import torch

from ml import dataset_builder, recommender, registry
from ml.classifier import PolicyClassifier

_WORKFLOWS = [
    {"id": "wf-medidor", "name": "Instalación de medidor", "description": "Alta de medidor eléctrico."},
    {"id": "wf-factura", "name": "Reclamo de facturación", "description": "Disputa de un cobro en la factura."},
]


# ---------------------------------------------------------------------------
# dataset_builder
# ---------------------------------------------------------------------------

def test_build_dataset_offline_genera_conteos_y_label_map() -> None:
    texts, labels, label_map = dataset_builder.build_dataset_offline(_WORKFLOWS, samples_per_class=5)

    assert len(texts) == 10
    assert labels == [0] * 5 + [1] * 5
    assert label_map["0"] == {"workflowId": "wf-medidor", "name": "Instalación de medidor"}
    assert label_map["1"]["workflowId"] == "wf-factura"


@pytest.mark.asyncio
async def test_build_dataset_llm_parsea_y_deduplica(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("ml.storage.ARTIFACTS_ROOT", tmp_path)

    # El LLM devuelve duplicados (distinta capitalización) → deben deduplicarse.
    content = '["Quiero un medidor", "quiero un medidor", "Necesito luz nueva"]'
    choice = SimpleNamespace(message=SimpleNamespace(content=content))
    response = MagicMock(choices=[choice])
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=response)

    with patch("ml.dataset_builder.get_client", return_value=client):
        texts, labels, label_map = await dataset_builder.build_dataset(
            _WORKFLOWS, samples_per_class=3, tenant_id="t1"
        )

    # El LLM devolvió 3 items con 1 duplicado → 2 únicos por clase × 2 clases = 4.
    assert len(texts) == 4
    assert labels == [0, 0, 1, 1]
    assert texts[:2] == ["Quiero un medidor", "Necesito luz nueva"]
    # La caché se escribió en disco.
    assert (tmp_path / "t1" / "dataset.jsonl").exists()


# ---------------------------------------------------------------------------
# classifier
# ---------------------------------------------------------------------------

def test_classifier_forward_devuelve_logits_por_clase() -> None:
    model = PolicyClassifier(input_dim=384, num_classes=4)
    out = model(torch.randn(2, 384))
    assert out.shape == (2, 4)


# ---------------------------------------------------------------------------
# registry
# ---------------------------------------------------------------------------

def test_registry_save_y_load_roundtrip(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("ml.storage.ARTIFACTS_ROOT", tmp_path)

    model = PolicyClassifier(input_dim=384, num_classes=2)
    label_map = {"0": {"workflowId": "wf-medidor", "name": "Medidor"},
                 "1": {"workflowId": "wf-factura", "name": "Factura"}}
    registry.save(
        "t1", model.state_dict(), label_map, metrics={"accuracy": 1.0},
        input_dim=384, num_classes=2,
    )

    loaded = registry.load("t1")
    assert loaded is not None
    loaded_model, loaded_map = loaded
    assert loaded_map == label_map
    assert loaded_model.num_classes == 2
    assert loaded_model(torch.randn(1, 384)).shape == (1, 2)


def test_registry_load_inexistente_devuelve_none(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("ml.storage.ARTIFACTS_ROOT", tmp_path)
    assert registry.load("no-existe") is None


# ---------------------------------------------------------------------------
# recommender (inferencia)
# ---------------------------------------------------------------------------

def _fake_encode(texts):
    """Encoder de juguete 2D para tests deterministas (sin descargar modelos)."""
    vectors = []
    for text in texts:
        lowered = text.lower()
        if "medidor" in lowered:
            vectors.append([1.0, 0.0])
        elif "factura" in lowered or "reclamo" in lowered or "cobro" in lowered:
            vectors.append([0.0, 1.0])
        else:
            vectors.append([0.5, 0.5])
    arr = np.array(vectors, dtype=np.float32)
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return arr / norms


def test_recommend_cosine_rankea_el_mejor_primero(monkeypatch) -> None:
    monkeypatch.setattr("ml.recommender.encode", _fake_encode)

    result = recommender.recommend_cosine("quiero instalar un medidor", _WORKFLOWS, top_k=2)

    assert [r["workflowId"] for r in result] == ["wf-medidor", "wf-factura"]
    assert all(0.0 <= r["score"] <= 1.0 for r in result)
    assert result[0]["score"] >= result[1]["score"]


def test_recommend_cosine_sin_workflows_devuelve_vacio(monkeypatch) -> None:
    monkeypatch.setattr("ml.recommender.encode", _fake_encode)
    assert recommender.recommend_cosine("hola", [], top_k=3) == []


def test_predict_with_model_mapea_etiquetas_y_ordena(monkeypatch) -> None:
    monkeypatch.setattr("ml.recommender.encode", lambda texts: np.zeros((1, 384), dtype=np.float32))

    model = PolicyClassifier(input_dim=384, num_classes=2)
    label_map = {"0": {"workflowId": "wf-medidor", "name": "Medidor"},
                 "1": {"workflowId": "wf-factura", "name": "Factura"}}

    result = recommender.predict_with_model(model, label_map, "lo que sea", top_k=2)

    assert len(result) == 2
    assert {r["workflowId"] for r in result} == {"wf-medidor", "wf-factura"}
    assert result[0]["score"] >= result[1]["score"]
    assert all(0.0 <= r["score"] <= 1.0 for r in result)
