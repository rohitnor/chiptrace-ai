from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from routers.tree import get_current_leaf_scores
from services.metric_tree import propagate_scores
from services import ml_service

router = APIRouter()


@router.get("/delay")
def predict_delay(db: Session = Depends(get_db)):
    """Predict supply delay days from current tree state."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    result = ml_service.predict_delay(all_scores)
    return result


@router.get("/resolution/{disruption_type}/{severity}")
def predict_resolution(disruption_type: str, severity: str, db: Session = Depends(get_db)):
    """Predict resolution days for a disruption type + severity."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)
    result = ml_service.predict_resolution(disruption_type, severity, all_scores)
    return result


@router.get("/impact/{delay_days}/{resolution_days}")
def predict_impact(delay_days: int, resolution_days: int, chip_criticality: int = 3):
    """Predict OEM production impact in days."""
    result = ml_service.predict_oem_impact(delay_days, resolution_days, chip_criticality)
    return result


@router.get("/full")
def full_prediction(db: Session = Depends(get_db)):
    """Run all 3 models and return combined prediction."""
    leaf_scores = get_current_leaf_scores(db)
    all_scores = propagate_scores(leaf_scores)

    delay = ml_service.predict_delay(all_scores)
    delay_days = delay.get("predicted_delay_days", 7)

    # Determine disruption type from worst node
    red_nodes = [n for n in all_scores.values() if n["status"] == "red"]
    if red_nodes:
        worst = min(red_nodes, key=lambda x: x["score"])
        node_id = worst["node_id"]
    else:
        node_id = ""

    dtype = "logistics"
    if "fab_concentration" in node_id:
        dtype = "fab_capacity"
    elif "material" in node_id:
        dtype = "material"
    elif "quality" in node_id:
        dtype = "quality"

    severity = "high" if delay_days > 14 else ("medium" if delay_days > 7 else "low")

    resolution = ml_service.predict_resolution(dtype, severity, all_scores)
    resolution_days = resolution.get("predicted_resolution_days", 14)

    impact = ml_service.predict_oem_impact(delay_days, resolution_days)

    return {
        "delay": delay,
        "resolution": resolution,
        "impact": impact,
        "summary": {
            "predicted_delay_days": delay_days,
            "predicted_resolution_days": resolution_days,
            "oem_impact_days": impact.get("oem_impact_days", 0),
            "disruption_type": dtype,
            "severity": severity,
        }
    }
