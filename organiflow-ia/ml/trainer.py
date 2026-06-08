"""Entrenamiento del clasificador de políticas y cálculo de métricas.

Responsabilidad única: dado un dataset (texts, labels), codificar los textos con
el encoder congelado, entrenar el MLP (`PolicyClassifier`) y devolver tanto los
pesos entrenados como las métricas de evaluación (accuracy top-1 y top-3, F1 por
clase, matriz de confusión) para la defensa académica.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from torch import nn

from ml.classifier import PolicyClassifier
from ml.encoder import EMBEDDING_DIM, encode

TrainResult = tuple[dict[str, torch.Tensor], dict[str, Any]]


def _set_seed(seed: int) -> None:
    np.random.seed(seed)
    torch.manual_seed(seed)


def _can_stratify(labels: list[int], num_classes: int) -> bool:
    """Solo se puede estratificar si cada clase tiene al menos 2 ejemplos."""
    counts = np.bincount(labels, minlength=num_classes)
    return bool((counts >= 2).all())


def _top_k_accuracy(logits: torch.Tensor, targets: torch.Tensor, k: int) -> float:
    """Proporción de aciertos donde la clase correcta está entre las top-k."""
    k = min(k, logits.shape[1])
    top_k = logits.topk(k, dim=1).indices  # (N, k)
    hits = (top_k == targets.unsqueeze(1)).any(dim=1).float()
    return float(hits.mean().item())


def train(
    texts: list[str],
    labels: list[int],
    num_classes: int,
    epochs: int = 40,
    lr: float = 1e-3,
    batch_size: int = 16,
    seed: int = 42,
) -> TrainResult:
    """Entrena el clasificador y devuelve `(state_dict, metrics)`.

    Args:
        texts: Prompts de entrenamiento.
        labels: Etiqueta entera (índice de clase) por cada texto.
        num_classes: Número total de clases (workflows).
        epochs, lr, batch_size, seed: Hiperparámetros del entrenamiento.

    Returns:
        Tupla con el `state_dict` del modelo entrenado y un dict de métricas
        serializable a JSON.
    """
    if len(texts) != len(labels):
        raise ValueError("texts y labels deben tener la misma longitud.")
    if num_classes < 2:
        raise ValueError("Se requieren al menos 2 clases (workflows) para entrenar.")

    _set_seed(seed)

    embeddings = encode(texts)
    y = np.asarray(labels, dtype=np.int64)

    stratify = y if _can_stratify(labels, num_classes) else None
    x_train, x_val, y_train, y_val = train_test_split(
        embeddings, y, test_size=0.2, random_state=seed, stratify=stratify
    )

    model = PolicyClassifier(input_dim=EMBEDDING_DIM, num_classes=num_classes)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    xt = torch.from_numpy(x_train)
    yt = torch.from_numpy(y_train)
    dataset = torch.utils.data.TensorDataset(xt, yt)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model.train()
    for _ in range(epochs):
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            loss = criterion(model(batch_x), batch_y)
            loss.backward()
            optimizer.step()

    # Evaluación en el conjunto de validación.
    model.eval()
    with torch.no_grad():
        val_logits = model(torch.from_numpy(x_val))
        preds = val_logits.argmax(dim=1).numpy()
        top1 = float((preds == y_val).mean())
        top3 = _top_k_accuracy(val_logits, torch.from_numpy(y_val), k=3)

    report = classification_report(
        y_val, preds, output_dict=True, zero_division=0
    )
    matrix = confusion_matrix(y_val, preds, labels=list(range(num_classes))).tolist()
    per_class_f1 = {
        str(cls): float(report.get(str(cls), {}).get("f1-score", 0.0))
        for cls in range(num_classes)
    }

    metrics: dict[str, Any] = {
        "accuracy": top1,
        "top3Accuracy": top3,
        "perClassF1": per_class_f1,
        "confusionMatrix": matrix,
        "numSamples": len(texts),
        "numClasses": num_classes,
        "valSize": int(len(y_val)),
        "report": report,
    }
    return model.state_dict(), metrics
