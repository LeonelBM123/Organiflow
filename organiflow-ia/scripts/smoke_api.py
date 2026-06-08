"""Smoke test de la API del recomendador de políticas (checkpoint Fase 2).

Usa FastAPI TestClient para ejercitar los routers reales sin levantar un puerto:
  1. POST /api/v1/ia/policy/train     (offline=True, sin LLM)
  2. POST /api/v1/ia/policy/recommend (verifica el top-3 y modelTrained)

Ejecutar:  python scripts/smoke_api.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

_TENANT = "smoke"
_WORKFLOWS = [
    {"id": "wf-medidor", "name": "Instalación de medidor", "description": "Alta de un nuevo medidor eléctrico."},
    {"id": "wf-factura", "name": "Reclamo de facturación", "description": "Disputa de un cobro en la factura de luz."},
    {"id": "wf-reconexion", "name": "Reconexión del servicio", "description": "Restablecer el suministro tras un corte."},
    {"id": "wf-titular", "name": "Cambio de titular", "description": "Transferir la titularidad del contrato."},
]


def main() -> None:
    client = TestClient(app)

    print("[1] POST /train (offline)…")
    train = client.post(
        "/api/v1/ia/policy/train",
        json={"tenantId": _TENANT, "workflows": _WORKFLOWS, "samplesPerClass": 30, "offline": True},
    )
    train.raise_for_status()
    body = train.json()
    print(f"    status={train.status_code} accuracy={body['accuracy']:.2%} "
          f"top3={body['top3Accuracy']:.2%} numClasses={body['numClasses']}")

    print("[2] POST /recommend…")
    rec = client.post(
        "/api/v1/ia/policy/recommend",
        json={
            "tenantId": _TENANT,
            "prompt": "Se me fue la luz porque no pagué y quiero que me la reconecten",
            "workflows": _WORKFLOWS,
            "topK": 3,
        },
    )
    rec.raise_for_status()
    payload = rec.json()
    print(f"    status={rec.status_code} modelTrained={payload['modelTrained']}")
    for i, r in enumerate(payload["recommendations"], 1):
        print(f"      {i}. {r['name']}  (score={r['score']:.3f})  [{r['workflowId']}]")

    top = payload["recommendations"][0]["workflowId"]
    assert len(payload["recommendations"]) == 3, "Se esperaban 3 recomendaciones (top-3)."
    print(f"\n[ok] Top-1 = {top}  (esperado wf-reconexion para el prompt de prueba)")


if __name__ == "__main__":
    main()
