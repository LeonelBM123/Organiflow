"""Generación del dataset de entrenamiento del recomendador de políticas.

Responsabilidad única: producir pares (prompt de cliente → workflow) para
entrenar el clasificador. Como no existen datos reales etiquetados, los prompts
se generan sintéticamente:

  - `build_dataset`          → usa el LLM (OpenRouter) para generar prompts variados
                               y realistas por cada workflow. Es la vía de producción.
  - `build_dataset_offline`  → genera prompts por plantillas, sin red ni LLM.
                               Útil para pruebas reproducibles y smoke tests.

El dataset se **cachea por tenant** en `artifacts/{tenantId}/dataset.jsonl`. Al
reentrenar, solo se generan los prompts de los workflows que aún no estén cacheados
(o que perdieron ejemplos), lo que abarata el reentrenamiento.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from core.llm_client import get_client
from core.response_parser import parse_json_response
from ml.storage import tenant_dir

_MODEL = "anthropic/claude-haiku-4.5"
_TEMPERATURE = 0.9  # Alta diversidad: queremos prompts variados, no deterministas.

# El tipo "workflow" es un dict con al menos {id, name, description}.
Workflow = dict[str, Any]
# label_map: índice de clase (str) → {workflowId, name}.
LabelMap = dict[str, dict[str, str]]


# ---------------------------------------------------------------------------
# Generación con LLM (producción)
# ---------------------------------------------------------------------------

def _build_generation_messages(workflow: Workflow, n: int) -> list[dict[str, str]]:
    """Construye los mensajes para pedirle al LLM `n` prompts de cliente."""
    system = (
        "Eres un generador de datos de entrenamiento para un clasificador de texto. "
        "Dada una política de negocio (workflow) de una empresa, generas frases realistas "
        "que un CLIENTE escribiría al solicitar ese trámite o servicio, en español. "
        "Las frases deben ser variadas en longitud, vocabulario y registro (formal e informal), "
        "incluir sinónimos y formas coloquiales, y NUNCA mencionar el nombre exacto del workflow. "
        "Responde SOLO con un array JSON de strings, sin texto adicional ni markdown."
    )
    user = (
        f"Política de negocio: {workflow.get('name', '')}\n"
        f"Descripción: {workflow.get('description') or 'Sin descripción'}\n\n"
        f"Genera {n} frases distintas que un cliente diría para solicitar este servicio."
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


async def _generate_prompts_llm(workflow: Workflow, n: int) -> list[str]:
    """Pide al LLM `n` prompts de cliente para un workflow. Devuelve lista de strings."""
    client = get_client()
    response = await client.chat.completions.create(
        model=_MODEL,
        messages=_build_generation_messages(workflow, n),
        temperature=_TEMPERATURE,
    )
    raw = response.choices[0].message.content or "[]"
    parsed = json.loads(parse_json_response(raw))
    prompts = [str(p).strip() for p in parsed if str(p).strip()]
    # Deduplicar preservando orden.
    seen: set[str] = set()
    unique = [p for p in prompts if not (p.lower() in seen or seen.add(p.lower()))]
    return unique


# ---------------------------------------------------------------------------
# Generación offline (plantillas, sin LLM) — para pruebas y reproducibilidad
# ---------------------------------------------------------------------------

_OFFLINE_TEMPLATES = [
    "Necesito {tema}.",
    "Quisiera solicitar {tema}.",
    "Hola, quiero hacer un trámite de {tema}.",
    "Buenas, ¿cómo solicito {tema}?",
    "Me gustaría iniciar el proceso de {tema}.",
    "Estoy buscando {tema}, ¿me pueden ayudar?",
    "Tengo que gestionar {tema} lo antes posible.",
    "¿Qué necesito para {tema}?",
    "Vengo a pedir {tema}.",
    "Requiero {tema} para mi empresa.",
]


def _topic(workflow: Workflow) -> str:
    """Deriva un 'tema' legible a partir del nombre/descripción del workflow."""
    name = (workflow.get("name") or "").strip().lower()
    description = (workflow.get("description") or "").strip().lower()
    return description or name or "un servicio"


def _generate_prompts_offline(workflow: Workflow, n: int) -> list[str]:
    """Genera `n` prompts por plantillas a partir del workflow (sin LLM)."""
    topic = _topic(workflow)
    prompts: list[str] = []
    i = 0
    while len(prompts) < n:
        template = _OFFLINE_TEMPLATES[i % len(_OFFLINE_TEMPLATES)]
        suffix = "" if i < len(_OFFLINE_TEMPLATES) else f" (caso {i})"
        prompts.append(template.format(tema=topic) + suffix)
        i += 1
    return prompts[:n]


# ---------------------------------------------------------------------------
# Caché en disco (JSONL: una línea por {workflowId, prompts})
# ---------------------------------------------------------------------------

def _dataset_path(tenant_id: str) -> Path:
    return tenant_dir(tenant_id, create=True) / "dataset.jsonl"


def _load_cache(path: Path) -> dict[str, list[str]]:
    if not path.exists():
        return {}
    data: dict[str, list[str]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        row = json.loads(line)
        data[row["workflowId"]] = list(row["prompts"])
    return data


def _save_cache(path: Path, data: dict[str, list[str]]) -> None:
    lines = [
        json.dumps({"workflowId": wid, "prompts": prompts}, ensure_ascii=False)
        for wid, prompts in data.items()
    ]
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

def _assemble(
    workflows: list[Workflow], data: dict[str, list[str]]
) -> tuple[list[str], list[int], LabelMap]:
    """Convierte el dict {workflowId: prompts} en arrays (texts, labels, label_map)
    en el orden del catálogo."""
    texts: list[str] = []
    labels: list[int] = []
    label_map: LabelMap = {}
    for idx, wf in enumerate(workflows):
        label_map[str(idx)] = {"workflowId": wf["id"], "name": wf.get("name", "")}
        for prompt in data.get(wf["id"], []):
            texts.append(prompt)
            labels.append(idx)
    return texts, labels, label_map


async def build_dataset(
    workflows: list[Workflow],
    samples_per_class: int = 30,
    tenant_id: str = "default",
    use_cache: bool = True,
) -> tuple[list[str], list[int], LabelMap]:
    """Construye el dataset usando el LLM, con caché incremental por tenant.

    Solo se generan prompts para los workflows ausentes en la caché (o con menos
    ejemplos de los pedidos); los demás se reutilizan. Los workflows eliminados
    del catálogo se descartan de la caché.

    Returns:
        Tupla `(texts, labels, label_map)` lista para entrenar.
    """
    path = _dataset_path(tenant_id)
    existing = _load_cache(path) if use_cache else {}
    catalog_ids = {wf["id"] for wf in workflows}
    data: dict[str, list[str]] = {
        wid: prompts for wid, prompts in existing.items() if wid in catalog_ids
    }

    for wf in workflows:
        if len(data.get(wf["id"], [])) < samples_per_class:
            data[wf["id"]] = await _generate_prompts_llm(wf, samples_per_class)

    _save_cache(path, data)
    return _assemble(workflows, data)


def build_dataset_offline(
    workflows: list[Workflow],
    samples_per_class: int = 30,
) -> tuple[list[str], list[int], LabelMap]:
    """Construye el dataset por plantillas (sin LLM ni red). Para tests/repro."""
    data = {wf["id"]: _generate_prompts_offline(wf, samples_per_class) for wf in workflows}
    return _assemble(workflows, data)
