"""Router para el endpoint de generación de esquemas de formulario de nodos."""
from __future__ import annotations

import traceback

from fastapi import APIRouter, HTTPException

from models import NodeSchemaRequest, NodeSchemaResponse
from services.schema_generator_service import SchemaGeneratorService

router = APIRouter(prefix="/api/v1/ia", tags=["Esquemas"])

_service = SchemaGeneratorService()


@router.post(
    "/generate-schema",
    response_model=NodeSchemaResponse,
    response_model_by_alias=True,
    summary="Genera un FormSchema para un nodo vía IA",
    description=(
        "Dado el tipo de nodo, el contexto del proceso y el departamento, "
        "genera un esquema de formulario (FormSchema) listo para usar en el node-panel de Angular."
    ),
)
async def generate_node_schema(request: NodeSchemaRequest) -> NodeSchemaResponse:
    try:
        return await _service.generate_schema(request)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
