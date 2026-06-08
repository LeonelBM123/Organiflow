"""Paquete de deep learning de Organiflow IA.

Contiene el recomendador de políticas de negocio (workflows) entrenado por nosotros:
  - `encoder`     → extractor de features congelado (sentence-transformers / BERT).
  - `classifier`  → la red neuronal (MLP) que SÍ entrenamos en PyTorch.
  - `dataset_builder` → generación del dataset sintético de entrenamiento.
  - `trainer`     → loop de entrenamiento + métricas (accuracy, F1, matriz de confusión).
  - `registry`    → persistencia de artefactos del modelo por tenant.
"""
