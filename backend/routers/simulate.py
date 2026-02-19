from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db
from services.alert_engine import build_alert_payload, log_disruption_to_db
from services.metric_tree import propagate_scores, get_leaf_nodes
from models.db_models import MetricSnapshot
import random
import json
from datetime import datetime

router = APIRouter()

# Store connected WebSocket clients
connected_clients = []


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


async def broadcast_alert(alert: dict):
    for client in connected_clients:
        try:
            await client.send_text(json.dumps(alert))
        except Exception:
            pass


@router.post("/disruption")
async def simulate_disruption(
    disruption_type: str = "fab_capacity",
    severity: str = "high",
    db: Session = Depends(get_db)
):
    """
    Inject a synthetic disruption into the metric tree.
    Triggers RED scores on relevant nodes and generates alert.
    """
    leaf_nodes = get_leaf_nodes()
    random.seed(datetime.now().microsecond)

    # Simulate degraded scores based on disruption type
    type_to_nodes = {
        "fab_capacity": ["resilience.fab_concentration.utilization_rate.load_pct",
                         "resilience.fab_concentration.utilization_rate.priority_queue",
                         "resilience.fab_concentration.geo_index.taiwan_pct"],
        "material": ["resilience.material.wafer_supplier_count",
                     "resilience.material.photoresist_exposure",
                     "resilience.material.specialty_gas"],
        "logistics": ["delivery.transit.port_congestion",
                      "resilience.logistics_infra.taiwan_strait_exposure",
                      "delivery.transit.air_freight"],
        "quality": ["quality.chip_quality.reject_rate",
                    "quality.chip_quality.aec_q100",
                    "quality.chip_quality.esd_damage"],
        "financial": ["resilience.early_warning.supplier_financial_stress",
                      "resilience.demand_shock.spot_dependency"],
    }

    severity_score_range = {
        "low": (35, 45), "medium": (25, 35), "high": (15, 25), "critical": (5, 15)
    }
    lo, hi = severity_score_range.get(severity, (20, 35))

    # Build leaf scores with disruption injected
    leaf_scores = {n: random.uniform(55, 90) for n in leaf_nodes}
    for bad_node in type_to_nodes.get(disruption_type, []):
        if bad_node in leaf_scores:
            leaf_scores[bad_node] = random.uniform(lo, hi)

    all_scores = propagate_scores(leaf_scores)
    alert = build_alert_payload(all_scores)

    if alert:
        # Persist to DB
        log_disruption_to_db(db, alert)
        # Broadcast to connected dashboards
        await broadcast_alert(alert)

    return {
        "status": "disruption_simulated",
        "disruption_type": disruption_type,
        "severity": severity,
        "alert": alert,
        "affected_node_count": len([n for n in all_scores.values() if n["status"] == "red"]),
    }
