"""Red neuronal entrenable que clasifica prompts de cliente en workflows.

Responsabilidad única: definir la arquitectura del clasificador. El encoder
(sentence-transformers) está congelado; **esta** es la red que entrenamos:
un perceptrón multicapa (MLP) con dos capas ocultas, ReLU y dropout.

    embedding (384) → Linear(256) → ReLU → Dropout
                    → Linear(128) → ReLU → Dropout
                    → Linear(num_classes)   [logits]
"""
from __future__ import annotations

import torch
from torch import nn


class PolicyClassifier(nn.Module):
    """MLP que mapea un embedding de texto a logits sobre los workflows del tenant."""

    def __init__(
        self,
        input_dim: int,
        num_classes: int,
        hidden1: int = 256,
        hidden2: int = 128,
        dropout: float = 0.3,
    ) -> None:
        super().__init__()
        self.input_dim = input_dim
        self.num_classes = num_classes
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden1),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden1, hidden2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden2, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Propaga un lote de embeddings y devuelve los logits sin normalizar."""
        return self.net(x)
