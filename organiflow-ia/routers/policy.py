"""Router del recomendador de políticas de negocio (deep learning).

Expone el entrenamiento y la inferencia del clasificador de workflows.
La lógica vive en `PolicyRecommenderService`; aquí solo se mapea HTTP ↔ servicio.
"""
from __future__ import annotations

import traceback

from fastapi import APIRouter, HTTPException

from models import (
    PolicyRecommendRequest,
    PolicyRecommendResponse,
    PolicyTrainRequest,
    PolicyTrainResponse,
)
from services.policy_recommender_service import PolicyRecommenderService

router = APIRouter(prefix="/api/v1/ia/policy", tags=["Recomendador de políticas"])

_service = PolicyRecommenderService()


@router.post(
    "/train",
    response_model=PolicyTrainResponse,
    response_model_by_alias=True,
    summary="Entrena el recomendador con el catálogo de workflows del tenant",
)
async def train_recommender(request: PolicyTrainRequest) -> PolicyTrainResponse:
    try:
        return await _service.train(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/recommend",
    response_model=PolicyRecommendResponse,
    response_model_by_alias=True,
    summary="Recomienda el top-k de workflows a partir del prompt del cliente",
)
async def recommend_policy(request: PolicyRecommendRequest) -> PolicyRecommendResponse:
    try:
        return _service.recommend(request)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
