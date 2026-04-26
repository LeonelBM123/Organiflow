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

async def generate_mutations(prompt: str, nodes: list, edges: list) -> MutationPlan:
    system_prompt = f"""
Eres el motor de IA de Organiflow. Tu trabajo es analizar el estado lógico de un
diagrama de flujo de trabajo (workflow) y la petición del usuario, y devolver
ÚNICAMENTE un objeto JSON válido con las mutaciones exactas necesarias.

REGLAS ESTRICTAS:
- Responde SOLO con JSON válido. Sin texto adicional, sin markdown, sin explicaciones fuera del JSON.
- Usa solo las acciones permitidas: ADD_NODE, UPDATE_NODE, DELETE_NODE, ADD_EDGE, DELETE_EDGE.
- Para ADD_NODE: node_data debe incluir id (único, formato "node-<nombre>"), name y type.
- Para ADD_EDGE: edge_data debe incluir sourceId y targetId con IDs de nodos existentes o recién creados.
- Para DELETE_NODE o DELETE_EDGE: target_id debe ser el id exacto del elemento a eliminar.
- Para UPDATE_NODE: target_id es el id del nodo y node_data contiene los campos a actualizar.
- No calcules coordenadas. Solo lógica pura.

ESQUEMA JSON OBLIGATORIO:
{_SCHEMA}
"""

    user_context = f"""
ESTADO ACTUAL DEL DIAGRAMA:
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