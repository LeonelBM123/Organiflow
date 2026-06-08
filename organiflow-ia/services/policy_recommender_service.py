"""Servicio orquestador del recomendador de políticas de negocio.

Responsabilidad única: coordinar el flujo de deep learning entre la capa HTTP
(routers) y el paquete `ml`:
  - `train`     → genera el dataset, entrena el clasificador y persiste el modelo.
  - `recommend` → carga el modelo del tenant y devuelve el top-k; si no hay modelo
                  (o el catálogo no coincide), usa el fallback coseno zero-shot.

No contiene lógica de red ni de modelo: delega en `ml.dataset_builder`,
`ml.trainer`, `ml.registry` y `ml.recommender`.
"""
from __future__ import annotations

from datetime import datetime, timezone

from ml import dataset_builder, recommender, registry, trainer
from ml.encoder import EMBEDDING_DIM
from models import (
    PolicyRecommendation,
    PolicyRecommendRequest,
    PolicyRecommendResponse,
    PolicyTrainRequest,
    PolicyTrainResponse,
)


class PolicyRecommenderService:
    """Entrena y consulta el recomendador de workflows de un tenant."""

    async def train(self, request: PolicyTrainRequest) -> PolicyTrainResponse:
        """Entrena (o reentrena) el clasificador del tenant y guarda los artefactos.

        Raises:
            ValueError: Si se reciben menos de 2 workflows (clases).
        """
        workflows = [wf.model_dump() for wf in request.workflows]
        if len(workflows) < 2:
            raise ValueError("Se requieren al menos 2 workflows para entrenar el recomendador.")

        if request.offline:
            texts, labels, label_map = dataset_builder.build_dataset_offline(
                workflows, samples_per_class=request.samples_per_class
            )
        else:
            texts, labels, label_map = await dataset_builder.build_dataset(
                workflows,
                samples_per_class=request.samples_per_class,
                tenant_id=request.tenant_id,
            )

        num_classes = len(label_map)
        state_dict, metrics = trainer.train(texts, labels, num_classes=num_classes)
        registry.save(
            request.tenant_id,
            state_dict,
            label_map,
            metrics,
            input_dim=EMBEDDING_DIM,
            num_classes=num_classes,
        )

        return PolicyTrainResponse(
            tenant_id=request.tenant_id,
            num_classes=num_classes,
            num_samples=metrics["numSamples"],
            accuracy=metrics["accuracy"],
            top3_accuracy=metrics["top3Accuracy"],
            per_class_f1=metrics["perClassF1"],
            trained_at=datetime.now(timezone.utc).isoformat(),
        )

    def recommend(self, request: PolicyRecommendRequest) -> PolicyRecommendResponse:
        """Devuelve el top-k de workflows para el prompt del cliente.

        Usa el clasificador entrenado si existe; en caso contrario (o si el modelo
        no recomienda ningún workflow del catálogo actual) cae al fallback coseno.
        """
        workflows = [wf.model_dump() for wf in request.workflows]
        catalog_ids = {wf["id"] for wf in workflows}

        loaded = registry.load(request.tenant_id)
        if loaded is not None:
            model, label_map = loaded
            raw = recommender.predict_with_model(
                model, label_map, request.prompt, top_k=request.top_k
            )
            # Descartar workflows que ya no estén en el catálogo (p. ej. archivados).
            filtered = [r for r in raw if not catalog_ids or r["workflowId"] in catalog_ids]
            if filtered:
                return PolicyRecommendResponse(
                    recommendations=[PolicyRecommendation(**r) for r in filtered],
                    model_trained=True,
                )

        # Fallback zero-shot por similitud coseno.
        cosine = recommender.recommend_cosine(
            request.prompt, workflows, top_k=request.top_k
        )
        return PolicyRecommendResponse(
            recommendations=[PolicyRecommendation(**r) for r in cosine],
            model_trained=False,
        )
