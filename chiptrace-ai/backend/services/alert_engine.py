"""
Alert Engine
------------
Detects RED/AMBER nodes, logs disruptions, generates structured alert JSON.
"""
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import DisruptionLog, MetricSnapshot
from services.metric_tree import trace_root_cause, METRIC_TREE_DEFINITION
import uuid


DISRUPTION_TYPE_MAP = {
    "resilience.fab_concentration": "fab_capacity",
    "resilience.material": "material",
    "resilience.osat": "fab_capacity",
    "resilience.logistics_infra": "logistics",
    "resilience.demand_shock": "financial",
    "resilience.early_warning": "fab_capacity",
    "delivery.transit": "logistics",
    "quality.chip_quality": "quality",
}


def detect_disruption_type(node_id: str) -> str:
    for prefix, dtype in DISRUPTION_TYPE_MAP.items():
        if node_id.startswith(prefix):
            return dtype
    return "unknown"


def severity_from_score(score: float) -> str:
    if score < 20:
        return "critical"
    elif score < 30:
        return "high"
    elif score < 40:
        return "medium"
    return "low"


def build_alert_payload(all_scores: dict, disruption_id: str = None) -> dict:
    """Build a structured alert JSON for the worst RED node."""
    red_nodes = {k: v for k, v in all_scores.items() if v["status"] == "red"}
    if not red_nodes:
        return {}

    # Find the most critical leaf RED node
    worst = min(red_nodes.values(), key=lambda x: x["score"])
    trace = trace_root_cause(all_scores, start="root")

    disruption_type = detect_disruption_type(worst["node_id"])
    severity = severity_from_score(worst["score"])

    resolution_estimates = {
        "fab_capacity": {"min": 14, "max": 45},
        "logistics": {"min": 3, "max": 14},
        "quality": {"min": 7, "max": 21},
        "material": {"min": 21, "max": 60},
        "financial": {"min": 14, "max": 90},
        "unknown": {"min": 7, "max": 30},
    }
    est = resolution_estimates.get(disruption_type, {"min": 7, "max": 30})

    return {
        "alert_id": disruption_id or str(uuid.uuid4()),
        "triggered_at": datetime.utcnow().isoformat(),
        "root_score": round(all_scores.get("root", {}).get("score", 0), 2),
        "root_cause_path": [t["node_id"] for t in trace],
        "root_cause_label_path": [t["label"] for t in trace],
        "leaf_node": worst["node_id"],
        "leaf_label": worst["label"],
        "leaf_score": worst["score"],
        "disruption_type": disruption_type,
        "severity": severity,
        "estimated_resolution_days": f"{est['min']}–{est['max']}",
        "suggested_action": get_suggested_action(disruption_type, severity),
    }


def get_suggested_action(disruption_type: str, severity: str) -> str:
    actions = {
        "fab_capacity": "Activate Tier-1 die bank buffer. Escalate LTA flex clause with fab. Review alternate node qualification.",
        "logistics": "Switch to air freight for critical SKUs. Activate alternate logistics lane. Notify OEM production planning.",
        "quality": "Trigger incoming inspection 100% check. Engage Tier-1 quality team for 8D report. Hold suspect lots.",
        "material": "Initiate emergency wafer procurement. Contact alternate substrate supplier. Review safety stock levels.",
        "financial": "Escalate to supply chain finance team. Consider prepayment to secure allocation. Review LTA terms.",
        "unknown": "Escalate to supply chain risk team for assessment.",
    }
    return actions.get(disruption_type, "Escalate immediately to supply chain risk team.")


def log_disruption_to_db(db: Session, alert_payload: dict, predicted_delay: int = None, oem_impact: int = None):
    """Persist a disruption to the DB."""
    disruption = DisruptionLog(
        disruption_id=alert_payload.get("alert_id", str(uuid.uuid4())),
        triggered_node_id=alert_payload.get("leaf_node"),
        disruption_type=alert_payload.get("disruption_type"),
        severity=alert_payload.get("severity"),
        oem_impact_days=oem_impact,
        predicted_resolution_days=predicted_delay,
        triggered_at=datetime.utcnow(),
    )
    db.add(disruption)
    db.commit()
    return disruption


def persist_metric_snapshot(db: Session, all_scores: dict):
    """Write a snapshot of all node scores to the DB."""
    now = datetime.utcnow()
    for node_id, data in all_scores.items():
        snap = MetricSnapshot(
            node_id=node_id,
            node_level=node_id.count("."),
            node_label=data["label"],
            score=data["score"],
            status=data["status"],
            flagged=data["flagged"],
            parent_node_id=data.get("parent"),
            evaluated_at=now,
        )
        db.add(snap)
    db.commit()
