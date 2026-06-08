"""Entrenamiento offline del recomendador de políticas (material de defensa).

Entrena el clasificador con un catálogo de ejemplo e imprime las métricas
(accuracy top-1 y top-3, classification_report) y, si matplotlib está disponible,
guarda la matriz de confusión como PNG.

Uso:
    python scripts/train_offline.py            # genera el dataset con el LLM (OpenRouter)
    python scripts/train_offline.py --offline  # genera el dataset por plantillas (sin red)
    python scripts/train_offline.py --samples 40

Ejecutar desde la raíz del microservicio `organiflow-ia`.
"""
from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Permite ejecutar el script directamente (`python scripts/train_offline.py`).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sklearn.metrics import classification_report  # noqa: E402

from ml import dataset_builder, registry, trainer  # noqa: E402
from ml.encoder import EMBEDDING_DIM  # noqa: E402

_TENANT_ID = "demo"

# Catálogo de ejemplo: política de negocio de una empresa eléctrica.
_EXAMPLE_WORKFLOWS = [
    {
        "id": "wf-medidor",
        "name": "Solicitud de instalación de medidor",
        "description": "Alta de un nuevo medidor eléctrico para una propiedad.",
    },
    {
        "id": "wf-reclamo-factura",
        "name": "Reclamo de facturación",
        "description": "Disputa o corrección de un cobro en la factura de luz.",
    },
    {
        "id": "wf-corte-reconexion",
        "name": "Reconexión del servicio",
        "description": "Restablecer el suministro eléctrico tras un corte por falta de pago.",
    },
    {
        "id": "wf-cambio-titular",
        "name": "Cambio de titular",
        "description": "Transferir la titularidad del contrato de electricidad a otra persona.",
    },
]


def _save_confusion_matrix(matrix: list[list[int]], labels: list[str]) -> None:
    """Guarda la matriz de confusión como PNG si matplotlib está instalado."""
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError:
        print("[info] matplotlib no instalado; se omite el PNG de la matriz de confusión.")
        return

    data = np.array(matrix)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.imshow(data, cmap="Blues")
    ax.set_xticks(range(len(labels)), labels, rotation=45, ha="right")
    ax.set_yticks(range(len(labels)), labels)
    ax.set_xlabel("Predicho")
    ax.set_ylabel("Real")
    ax.set_title("Matriz de confusión — recomendador de políticas")
    for i in range(len(labels)):
        for j in range(len(labels)):
            ax.text(j, i, str(data[i, j]), ha="center", va="center")
    fig.tight_layout()
    output = Path(__file__).resolve().parent.parent / "artifacts" / _TENANT_ID / "confusion_matrix.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=120)
    print(f"[ok] Matriz de confusión guardada en {output}")


def _print_report(texts: list[str], labels: list[int], metrics: dict, label_map: dict) -> None:
    names = [label_map[str(i)]["name"] for i in range(len(label_map))]
    print("\n================ RESULTADOS ================")
    print(f"Clases (workflows): {metrics['numClasses']}")
    print(f"Muestras totales:   {metrics['numSamples']}  (validación: {metrics['valSize']})")
    print(f"Accuracy top-1:     {metrics['accuracy']:.2%}")
    print(f"Accuracy top-3:     {metrics['top3Accuracy']:.2%}")
    print("\nF1 por clase:")
    for idx, name in enumerate(names):
        print(f"  - {name}: {metrics['perClassF1'][str(idx)]:.2f}")
    print("\nMatriz de confusión (filas=real, columnas=predicho):")
    for row in metrics["confusionMatrix"]:
        print("  " + " ".join(f"{v:3d}" for v in row))
    print("===========================================\n")


async def _build(offline: bool, samples: int):
    if offline:
        return dataset_builder.build_dataset_offline(_EXAMPLE_WORKFLOWS, samples_per_class=samples)
    return await dataset_builder.build_dataset(
        _EXAMPLE_WORKFLOWS, samples_per_class=samples, tenant_id=_TENANT_ID
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrena el recomendador de políticas offline.")
    parser.add_argument("--offline", action="store_true", help="Genera el dataset por plantillas (sin LLM).")
    parser.add_argument("--samples", type=int, default=30, help="Ejemplos por clase (default 30).")
    args = parser.parse_args()

    print(f"[1/3] Generando dataset ({'plantillas' if args.offline else 'LLM'})…")
    texts, labels, label_map = asyncio.run(_build(args.offline, args.samples))
    print(f"      {len(texts)} prompts generados para {len(label_map)} workflows.")

    print("[2/3] Entrenando el clasificador (encoder congelado + MLP)…")
    state_dict, metrics = trainer.train(texts, labels, num_classes=len(label_map))

    print("[3/3] Guardando artefactos…")
    registry.save(
        _TENANT_ID, state_dict, label_map, metrics,
        input_dim=EMBEDDING_DIM, num_classes=len(label_map),
    )

    _print_report(texts, labels, metrics, label_map)
    _save_confusion_matrix(metrics["confusionMatrix"], [label_map[str(i)]["name"] for i in range(len(label_map))])


if __name__ == "__main__":
    main()
