from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import DisruptionLog

router = APIRouter()


@router.get("/")
def list_disruptions(limit: int = 20, db: Session = Depends(get_db)):
    records = db.query(DisruptionLog).order_by(DisruptionLog.triggered_at.desc()).limit(limit).all()
    return [
        {
            "disruption_id": r.disruption_id,
            "triggered_node_id": r.triggered_node_id,
            "disruption_type": r.disruption_type,
            "severity": r.severity,
            "oem_impact_days": r.oem_impact_days,
            "predicted_resolution_days": r.predicted_resolution_days,
            "actual_resolution_days": r.actual_resolution_days,
            "triggered_at": r.triggered_at.isoformat() if r.triggered_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
            "resolution_action": r.resolution_action,
        }
        for r in records
    ]


@router.get("/{disruption_id}")
def get_disruption(disruption_id: str, db: Session = Depends(get_db)):
    r = db.query(DisruptionLog).filter(DisruptionLog.disruption_id == disruption_id).first()
    if not r:
        return {"error": "Disruption not found"}
    return {
        "disruption_id": r.disruption_id,
        "triggered_node_id": r.triggered_node_id,
        "disruption_type": r.disruption_type,
        "severity": r.severity,
        "oem_impact_days": r.oem_impact_days,
        "predicted_resolution_days": r.predicted_resolution_days,
        "actual_resolution_days": r.actual_resolution_days,
        "triggered_at": r.triggered_at.isoformat() if r.triggered_at else None,
        "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        "resolution_action": r.resolution_action,
    }
