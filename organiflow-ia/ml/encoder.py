"""Encoder de texto basado en sentence-transformers (deep learning congelado).

Responsabilidad única: convertir texto en español en embeddings densos
multilingües. El modelo se carga una sola vez (singleton) y queda **congelado**:
no se entrena, solo se usa como extractor de características para el clasificador.

Los embeddings se normalizan (norma L2 = 1), de modo que el producto punto entre
dos vectores equivale a su similitud coseno — útil para el fallback zero-shot.
"""
from __future__ import annotations

import functools
from collections.abc import Sequence

import numpy as np

# Modelo multilingüe compacto (384 dimensiones) con buen soporte de español.
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384


@functools.lru_cache(maxsize=1)
def _get_model():
    """Carga (una sola vez) el modelo de embeddings. Import perezoso para no
    pagar el coste de importar sentence-transformers si nunca se usa el encoder."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def encode(texts: Sequence[str]) -> np.ndarray:
    """Codifica una lista de textos en una matriz de embeddings normalizados.

    Args:
        texts: Secuencia de cadenas a codificar.

    Returns:
        Matriz `np.ndarray` de forma `(len(texts), EMBEDDING_DIM)` y dtype float32.
    """
    model = _get_model()
    embeddings = model.encode(
        list(texts),
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return embeddings.astype("float32")
