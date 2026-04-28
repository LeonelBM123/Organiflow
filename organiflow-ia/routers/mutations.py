"""Router para el endpoint de generación de mutaciones de workflow."""
from __future__ import annotations

import traceback

from fastapi import APIRouter, HTTPException

from models import EditRequest, MutationPlan
from services.mutation_service import MutationService

router = APIRouter(prefix="/api/v1/ia", tags=["Mutaciones"])

_service = MutationService()


@router.post(
    "/mutations",
    response_model=MutationPlan,
    summary="Genera mutaciones de workflow",
    description=(
        "Recibe el estado actual del diagrama y una instrucción en lenguaje natural, "
        "y retorna un plan de mutaciones para aplicar al canvas."
    ),
)
async def get_workflow_mutations(request: EditRequest) -> MutationPlan:
    try:
        return await _service.generate_mutations(
            prompt=request.prompt,
            nodes=request.current_nodes,
            edges=request.current_edges,
            lanes=request.current_lanes,
            available_departments=request.available_departments,
        )
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
