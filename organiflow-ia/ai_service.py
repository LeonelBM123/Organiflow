import os
import json
import re
from openai import AsyncOpenAI
from models import MutationPlan
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# Generamos el schema una sola vez al arrancar el módulo
_SCHEMA = json.dumps(MutationPlan.model_json_schema(), indent=2, ensure_ascii=False)

async def generate_mutations(prompt: str, nodes: list, edges: list, lanes: list) -> MutationPlan:
    system_prompt = f"""
Eres el motor de IA de Organiflow. Tu trabajo es analizar el estado lógico de un
diagrama de flujo de trabajo (workflow) con carriles (swimlanes/departamentos) y la
petición del usuario, y devolver ÚNICAMENTE un objeto JSON válido con las mutaciones exactas.

REGLAS ESTRICTAS:
- Responde SOLO con JSON válido. Sin texto adicional, sin markdown, sin explicaciones.
- Usa solo: ADD_NODE, UPDATE_NODE, DELETE_NODE, ADD_EDGE, DELETE_EDGE, ADD_LANE, UPDATE_LANE, DELETE_LANE.

REGLAS DE CARRILES (SWIMLANES):
- Cada carril representa un departamento o área de la empresa.
- Los carriles disponibles están en "Carriles actuales". Úsalos para asignar laneId a los nodos.
- Si el usuario pide crear un nuevo departamento/área/carril → usa ADD_LANE con lane_data = {{ id, name }}.
- Si el usuario pide renombrar un carril → usa UPDATE_LANE con target_id (el id del carril) y lane_data = {{ name }}.
- Si el usuario pide eliminar un carril → usa DELETE_LANE con target_id (el id del carril).
- Si el usuario pide asignar un nodo a un departamento → usa UPDATE_NODE con target_id y node_data.laneId = id del carril.

REGLAS DE NODOS:
- Para ADD_NODE: node_data debe incluir id (ej: node-uuid4), name, type (START/TASK/CONDITION/MERGE/END).
  SIEMPRE incluye laneId si el usuario indica a qué departamento pertenece o si hay un carril obvio.
  El laneId debe ser el id de uno de los carriles existentes (sin prefijo "lane_").
- Para UPDATE_NODE: usa target_id y node_data con los campos a cambiar (nombre, laneId, etc.).
- Para DELETE_NODE: usa target_id.

REGLAS DE CONECTORES:
- Para ADD_EDGE: edge_data debe incluir sourceId, targetId, y relationType (SEQUENTIAL/CONDITIONAL/ITERATIVE/MERGE).
- Para DELETE_EDGE: usa target_id.

ESQUEMA JSON OBLIGATORIO:
{_SCHEMA}
"""

    user_context = f"""
ESTADO ACTUAL DEL DIAGRAMA:
Carriles actuales (Departamentos): {json.dumps(lanes, ensure_ascii=False)}
Nodos: {json.dumps(nodes, ensure_ascii=False)}
Conectores: {json.dumps(edges, ensure_ascii=False)}

PETICIÓN DEL USUARIO: {prompt}
"""

    response = await client.chat.completions.create(
        model="anthropic/claude-haiku-4.5",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_context},
        ],
        temperature=0.1,
    )

    raw = response.choices[0].message.content or ""

    # Extraer JSON si el modelo envuelve la respuesta en bloques de markdown
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
    if match:
        raw = match.group(1)

    return MutationPlan.model_validate_json(raw.strip())