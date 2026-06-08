"""Inferencia del recomendador de políticas (top-k).

Responsabilidad única: dado un prompt de cliente, producir el ranking de
workflows recomendados. Dos modos:

  - `predict_with_model`  → usa el clasificador entrenado (softmax sobre logits).
  - `recommend_cosine`    → fallback zero-shot por similitud coseno entre el
                            embedding del prompt y los de cada workflow (cuando
                            no hay modelo entrenado o el workflow es muy nuevo).
"""
from __future__ import annotations

from typing import Any

import numpy as np
import torch

from ml.classifier import PolicyClassifier
from ml.encoder import encode

# Una recomendación: {workflowId, name, score} (score en 0..1).
Recommendation = dict[str, Any]
LabelMap = dict[str, dict[str, str]]
Workflow = dict[str, Any]


def predict_with_model(
    model: PolicyClassifier,
    label_map: LabelMap,
    prompt: str,
    top_k: int = 3,
) -> list[Recommendation]:
    """Devuelve el top-k de workflows según el clasificador entrenado."""
    embedding = encode([prompt])
    with torch.no_grad():
        logits = model(torch.from_numpy(embedding))
        probs = torch.softmax(logits, dim=1).squeeze(0)

    k = min(top_k, probs.shape[0])
    top = torch.topk(probs, k)
    recommendations: list[Recommendation] = []
    for score, index in zip(top.values.tolist(), top.indices.tolist()):
        entry = label_map.get(str(index))
        if not entry:
            continue
        recommendations.append(
            {
                "workflowId": entry["workflowId"],
                "name": entry.get("name", ""),
                "score": round(float(score), 4),
            }
        )
    return recommendations


def _workflow_text(workflow: Workflow) -> str:
    """Texto representativo del workflow para el fallback coseno."""
    name = workflow.get("name") or ""
    description = workflow.get("description") or ""
    return f"{name}. {description}".strip()


def recommend_cosine(
    prompt: str,
    workflows: list[Workflow],
    top_k: int = 3,
) -> list[Recommendation]:
    """Fallback zero-shot: ranking por similitud coseno prompt↔workflow.

    Los embeddings vienen normalizados del encoder, así que el producto punto
    equivale al coseno. El score se reescala de [-1, 1] a [0, 1].
    """
    if not workflows:
        return []

    prompt_vec = encode([prompt])[0]
    workflow_vecs = encode([_workflow_text(wf) for wf in workflows])
    similarities = workflow_vecs @ prompt_vec  # coseno (vectores normalizados)

    k = min(top_k, len(workflows))
    top_indices = np.argsort(similarities)[::-1][:k]
    recommendations: list[Recommendation] = []
    for index in top_indices:
        workflow = workflows[int(index)]
        score = (float(similarities[int(index)]) + 1.0) / 2.0
        recommendations.append(
            {
                "workflowId": workflow["id"],
                "name": workflow.get("name", ""),
                "score": round(score, 4),
            }
        )
    return recommendations
