from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# Datos lógicos mínimos de Organiflow
class OrganiflowNode(BaseModel):
    id: Optional[str] = Field(default=None, description="ID único del nodo (autogenerado si no se indica)")
    type: str = Field(default="TASK", description="START, TASK, CONDITION, MERGE, END")
    name: str

    def model_post_init(self, __context: object) -> None:
        if not self.id:
            import uuid
            self.id = f"node-{uuid.uuid4().hex[:8]}"

class OrganiflowEdge(BaseModel):
    id: Optional[str] = Field(None, description="ID del conector (autogenerado si no se indica)")
    sourceId: str
    targetId: str
    relationType: str = Field(default="SEQUENTIAL", description="SEQUENTIAL o CONDITIONAL")

# El esquema de mutaciones para manipular Syncfusion
class WorkflowMutation(BaseModel):
    action: Literal["ADD_NODE", "UPDATE_NODE", "DELETE_NODE", "ADD_EDGE", "DELETE_EDGE"]
    target_id: Optional[str] = Field(None, description="Requerido para DELETE y UPDATE")
    node_data: Optional[OrganiflowNode] = Field(None, description="Requerido para ADD_NODE")
    edge_data: Optional[OrganiflowEdge] = Field(None, description="Requerido para ADD_EDGE")

class MutationPlan(BaseModel):
    razonamiento: str = Field(description="Explicación breve de las acciones a tomar")
    mutations: List[WorkflowMutation]

# Lo que el cliente enviará a nuestro endpoint
class EditRequest(BaseModel):
    prompt: str
    current_nodes: List[dict]
    current_edges: List[dict]