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
- Cada carril representa un departamento o área de la empresa. Los carriles disponibles están en "Carriles actuales".
- PRIORIDAD 1 (INFERIR Y REUTILIZAR): Cuando el usuario mencione un departamento para una tarea, PRIMERO evalúa si existe una coincidencia lógica o semántica con alguno de los "Carriles actuales". Usa el id de ese carril existente para asignar el laneId a los nodos.
- PRIORIDAD 2 (CREAR - ADD_LANE): SOLO si el departamento mencionado NO tiene ninguna relación coherente con los carriles existentes, o si el usuario pide explícitamente crear uno nuevo, entonces usa ADD_LANE. Genera un "name" basado en la petición y crea un "id" lógico y único (ej: "lane-finanzas").
- Si el usuario pide renombrar un carril → usa UPDATE_LANE con target_id (el id del carril) y lane_data = {{ name }}.
- Si el usuario pide eliminar un carril → usa DELETE_LANE con target_id (el id del carril).
- Si el usuario pide asignar un nodo a un departamento → usa UPDATE_NODE con target_id y node_data.laneId = id del carril.
- REGLA ESPECIAL — Carril "General" (id: "default"): este carril es un placeholder temporal que aparece
  cuando el workflow no tiene departamentos reales. Si los "Carriles actuales" contienen un carril con
  id "default" o nombre "General", Y la petición implica crear o usar carriles específicos, DEBES incluir
  al inicio de las mutations un DELETE_LANE con target_id "default" para eliminarlo. No lo elimines
  si no se están creando/usando otros carriles o si es el único carril y no hay alternativa.

REGLAS DE NODOS:
- Para ADD_NODE: node_data debe incluir id (ej: node-uuid4), name, type (START/TASK/CONDITION/MERGE/END).
  SIEMPRE incluye laneId si el usuario indica a qué departamento pertenece o si hay un carril obvio.
  El laneId debe ser el id de uno de los carriles existentes (sin prefijo "lane_").
- Para UPDATE_NODE: usa target_id y node_data con los campos a cambiar (nombre, laneId, etc.).
- Para DELETE_NODE: usa target_id.

REGLAS UML — DIAGRAMA DE ACTIVIDADES (obligatorias, nunca las violes):
1. ÚNICO START: Solo puede existir UN nodo de tipo START en todo el diagrama. Si ya hay uno en
   "Nodos", no crees otro. Si el usuario pide uno nuevo, reutiliza el existente o ignora la creación.
2. ÚNICO END: Solo puede existir UN nodo de tipo END en todo el diagrama. Igual que START.
3. FLUJO COMPLETO: Todo nodo nuevo debe quedar conectado al flujo. No dejes nodos huérfanos.
   Si añades un nodo intermedio, añade también las edges necesarias para integrarlo al flujo.
4. CONDITION (decisión XOR — exclusiva): Solo UNA rama se ejecutará. Debe tener exactamente
   1 edge entrante y exactamente 2 edges salientes (cada rama es un camino alternativo
   mutuamente exclusivo).
   - Si el usuario menciona únicamente 1 rama de salida, debes crear AUTOMÁTICAMENTE una
     segunda edge hacia el nodo END existente (o hacia un nuevo END si no existe aún).
   - NUNCA dejes un CONDITION con solo 1 edge saliente.
   - REGLA VISUAL ESTRICTA: Los 2 caminos que salen de este nodo DEBEN salir por los lados opuestos. La primera edge saliente debe configurarse para salir por el lado "izquierdo" (left) y la segunda edge por el lado "derecho" (right).
5. MERGE (unión): Un nodo MERGE debe tener 2+ edges entrantes y exactamente 1 edge saliente.
   Úsalo para reunir ramas paralelas o condicionales antes de continuar.
6. ITERATOR: Representa un bucle. Tiene 1 edge entrante, 1 edge saliente que continúa el flujo,
   y 1 edge de retorno hacia sí mismo o hacia el nodo anterior (relationType: ITERATIVE).
7. START siempre tiene 0 edges entrantes y 1 edge saliente.
8. END siempre tiene 1+ edges entrantes y 0 edges salientes.
9. Si el diagrama ya tiene un flujo START→...→END y el usuario pide insertar un nodo intermedio,
   elimina la edge existente entre los nodos adyacentes y crea dos nuevas edges pasando por el nuevo nodo.

ORDEN DE LAS MUTACIONES — CRÍTICO PARA EL LAYOUT VISUAL:
El canvas posiciona cada nodo nuevo DEBAJO del anterior dentro del mismo carril, en el orden
exacto en que aparecen las mutaciones. Por eso el orden en que emites los ADD_NODE determina
el orden visual de arriba hacia abajo. Debes seguir estas reglas de ordenación:

A. Emite las mutaciones ADD_NODE en orden TOPOLÓGICO del flujo:
   - START siempre primero (si se crea).
   - Luego los nodos intermedios en el orden en que se ejecutarían.
   - END siempre al último (si se crea).
B. Dentro del mismo carril, los nodos que se ejecutan antes deben aparecer ANTES en la lista.
C. Si hay ramas de un CONDITION, emite los nodos de cada rama
   juntos por carril: todos los de rama A juntos, luego los de rama B.
D. Emite los ADD_EDGE al final, después de todos los ADD_NODE, para que las referencias
   a nodos recién creados ya existan.
E. Nunca mezcles ADD_NODE de distintos pasos del flujo de forma aleatoria.

REGLAS DE CONECTORES:
- Para ADD_EDGE: edge_data debe incluir sourceId, targetId, y relationType (SEQUENTIAL/CONDITIONAL/ITERATIVE/MERGE).
- IMPORTANTE PARA NODOS CONDITION: Cuando uses ADD_EDGE donde el sourceId sea un nodo CONDITION, debes añadir la propiedad que define el puerto de salida (ej: "sourceHandle": "left" para la primera opción, y "sourceHandle": "right" para la segunda opción).
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