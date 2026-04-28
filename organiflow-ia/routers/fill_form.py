"""
Router para el endpoint de relleno de formulario por voz.

POST /api/v1/ia/fill-form
  Recibe el transcript de voz y el esquema del formulario.
  Devuelve un mapa campo→valor extraído del transcript.
"""
from __future__ import annotations

from fastapi import APIRouter

from models import FillFormRequest, FillFormResponse
from services.fill_form_service import FillFormService

router = APIRouter()
_svc = FillFormService()


@router.post(
    "/api/v1/ia/fill-form",
    response_model=FillFormResponse,
    summary="Rellenar formulario a partir de voz",
    description=(
        "Recibe el transcript de voz del funcionario y el esquema del formulario. "
        "El LLM extrae los valores para cada campo y los devuelve listos para "
        "aplicar a los controles del formulario reactivo de Angular."
    ),
)
async def fill_form(request: FillFormRequest) -> FillFormResponse:
    return await _svc.fill(request)
