"""Router para el endpoint de análisis lógico de workflow."""
from __future__ import annotations

import traceback

from fastapi import APIRouter, HTTPException

from models import WorkflowAnalysisRequest, WorkflowAnalysisResponse
from services.analyzer_service import AnalyzerService

router = APIRouter(prefix="/api/v1/ia", tags=["Análisis"])

_service = AnalyzerService()


@router.post(
    "/analyze",
    response_model=WorkflowAnalysisResponse,
    response_model_by_alias=True,
    summary="Analiza errores lógicos y cuellos de botella",
    description=(
        "Recibe el estado actual del diagrama y retorna los errores lógicos UML "
        "detectados, posibles cuellos de botella y un resumen del estado del workflow."
    ),
)
async def analyze_workflow(request: WorkflowAnalysisRequest) -> WorkflowAnalysisResponse:
    try:
        return _service.analyze(
            nodes=request.nodes,
            edges=request.edges,
            lanes=request.lanes,
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
