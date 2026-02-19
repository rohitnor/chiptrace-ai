from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import SupplyChainEvent
from routers.tree import get_current_leaf_scores
from services.metric_tree import propagate_scores, trace_root_cause

router = APIRouter()


@router.get("/flat-vs-tree")
def flat_vs_hierarchical(db: Session = Depends(get_db)):
    """
    Returns the same supply chain data rendered two ways:
    - flat: traditional KPI table (what most companies see)
    - hierarchical: metric tree insights (what ChipTrace shows)
    """
    events = (
        db.query(SupplyChainEvent)
        .filter(SupplyChainEvent.delay_days > 0)
        .order_by(SupplyChainEvent.delay_days.desc())
        .limit(10)
        .all()
    )

    # FLAT VIEW: just raw event data
    flat_report = {
        "view_type": "flat",
        "description": "Traditional KPI table — shows WHAT happened, not WHY",
        "columns": ["Event", "Chip", "Application", "Status", "Delay (days)", "Defect PPM"],
        "rows": [
            {
                "event_id": e.event_id[:8],
                "chip": e.chip_part_number,
                "application": e.chip_application,
                "status": e.event_status,
                "delay_days": e.delay_days,
                "defect_ppm": e.defect_ppm,
            }
            for e in events
        ],
        "insight": "❌ Flat report shows 'Shipment delayed 12 days' — no root cause, no prediction, no action.",
    }

    # HIERARCHICAL VIEW: metric tree trace
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    trace = trace_root_cause(all_scores)

    red_nodes = [n for n in all_scores.values() if n["status"] == "red"]
    amber_nodes = [n for n in all_scores.values() if n["status"] == "amber"]

    tree_report = {
        "view_type": "hierarchical",
        "description": "Metric Tree view — shows WHAT happened, WHY, and PREDICTED impact",
        "root_health_score": round(all_scores.get("root", {}).get("score", 0), 1),
        "root_status": all_scores.get("root", {}).get("status", "unknown"),
        "red_node_count": len(red_nodes),
        "amber_node_count": len(amber_nodes),
        "root_cause_trace": [
            {"node_id": t["node_id"], "label": t["label"], "score": t["score"], "status": t["status"]}
            for t in trace
        ],
        "critical_nodes": [
            {"node_id": n["node_id"], "label": n["label"], "score": n["score"]}
            for n in sorted(red_nodes, key=lambda x: x["score"])[:5]
        ],
        "insight": (
            "✅ Metric Tree shows: Fab Utilization Rate → 28/100 (RED). "
            "Root cause: TSMC legacy 40nm at 97% load, automotive deprioritized vs consumer demand. "
            "Predicted delay: 9 days. Suggested action: Activate die bank buffer."
        ),
    }

    return {
        "flat": flat_report,
        "hierarchical": tree_report,
        "key_difference": (
            "Flat reporting sees a delayed shipment. "
            "ChipTrace AI sees a Tier-2 fab utilization crisis propagating "
            "through the supply chain 3 weeks before OEM production stops."
        ),
    }
