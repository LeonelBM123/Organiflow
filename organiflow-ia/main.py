from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import EditRequest, MutationPlan
from ai_service import generate_mutations

app = FastAPI(title="Organiflow AI Assistant")

# Configurar CORS para permitir peticiones desde tu Frontend/Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambia esto por tu dominio o localhost:4200
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/ia/mutations", response_model=MutationPlan)
async def get_workflow_mutations(request: EditRequest):
    try:
        plan = await generate_mutations(
            prompt=request.prompt,
            nodes=request.current_nodes,
            edges=request.current_edges,
            lanes=request.current_lanes
        )
        return plan
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))