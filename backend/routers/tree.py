from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.metric_tree import propagate_scores, get_leaf_nodes, METRIC_TREE_DEFINITION, get_all_alerts
from models.db_models import MetricSnapshot
import random

router = APIRouter()


def get_current_leaf_scores(db: Session):
    """Pull the most recent snapshot scores for leaf nodes, or simulate if empty."""
    leaf_nodes = get_leaf_nodes()
    # Try DB first
    latest = {}
    for node_id in leaf_nodes:
        snap = (
            db.query(MetricSnapshot)
            .filter(MetricSnapshot.node_id == node_id)
            .order_by(MetricSnapshot.evaluated_at.desc())
            .first()
        )
        if snap:
            latest[node_id] = snap.score

    # If no snapshots yet, simulate
    if not latest:
        random.seed(99)
        for node_id in leaf_nodes:
            base = random.uniform(45, 95)
            # Inject realistic low scores for demo
            if "fab_concentration" in node_id or "taiwan" in node_id:
                base = random.uniform(20, 45)
            elif "material" in node_id:
                base = random.uniform(30, 55)
            latest[node_id] = base
    return latest


@router.get("/snapshot")
def get_full_snapshot(db: Session = Depends(get_db)):
    """Full metric tree with all node scores."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    # Convert to list for JSON serialization
    nodes = list(all_scores.values())
    return {
        "total_nodes": len(nodes),
        "root_score": all_scores.get("root", {}).get("score", 0),
        "root_status": all_scores.get("root", {}).get("status", "unknown"),
        "nodes": nodes,
    }


@router.get("/node/{node_id:path}")
def get_node(node_id: str, db: Session = Depends(get_db)):
    """Single node with history."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    node = all_scores.get(node_id)
    if not node:
        return {"error": "Node not found"}

    history = (
        db.query(MetricSnapshot)
        .filter(MetricSnapshot.node_id == node_id)
        .order_by(MetricSnapshot.evaluated_at.desc())
        .limit(30)
        .all()
    )
    node["history"] = [{"score": h.score, "status": h.status, "evaluated_at": h.evaluated_at.isoformat()} for h in history]
    return node


@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """All active RED/AMBER nodes."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    alerts = get_all_alerts(all_scores)
    return {"total_alerts": len(alerts), "alerts": alerts}


@router.get("/tree-definition")
def get_tree_definition():
    """Return the raw metric tree definition (node structure)."""
    return {
        "nodes": [
            {"node_id": k, **v}
            for k, v in METRIC_TREE_DEFINITION.items()
        ]
    }
