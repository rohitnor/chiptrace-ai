from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Supplier, SupplyChainEvent, InventoryPosition

router = APIRouter()


@router.get("/")
def list_suppliers(tier: int = None, db: Session = Depends(get_db)):
    q = db.query(Supplier)
    if tier is not None:
        q = q.filter(Supplier.tier == tier)
    suppliers = q.all()
    return [
        {
            "supplier_id": s.supplier_id,
            "name": s.name,
            "tier": s.tier,
            "country": s.country,
            "region": s.region,
            "node_specialization": s.node_specialization,
            "financial_health_score": s.financial_health_score,
            "geopolitical_risk_score": s.geopolitical_risk_score,
            "is_single_source": s.is_single_source,
        }
        for s in suppliers
    ]


@router.get("/{supplier_id}/events")
def get_supplier_events(supplier_id: str, limit: int = 20, db: Session = Depends(get_db)):
    events = (
        db.query(SupplyChainEvent)
        .filter(SupplyChainEvent.supplier_id == supplier_id)
        .order_by(SupplyChainEvent.recorded_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "event_id": e.event_id,
            "event_type": e.event_type,
            "chip_part_number": e.chip_part_number,
            "chip_node": e.chip_node,
            "chip_application": e.chip_application,
            "delay_days": e.delay_days,
            "event_status": e.event_status,
            "disruption_type": e.disruption_type,
            "defect_ppm": e.defect_ppm,
            "recorded_at": e.recorded_at.isoformat() if e.recorded_at else None,
        }
        for e in events
    ]


@router.get("/{supplier_id}/inventory")
def get_supplier_inventory(supplier_id: str, db: Session = Depends(get_db)):
    positions = (
        db.query(InventoryPosition)
        .filter(InventoryPosition.supplier_id == supplier_id)
        .all()
    )
    return [
        {
            "chip_part_number": p.chip_part_number,
            "stock_type": p.stock_type,
            "quantity_units": p.quantity_units,
            "days_of_cover": p.days_of_cover,
            "lta_coverage_pct": p.lta_coverage_pct,
            "spot_exposure_pct": p.spot_exposure_pct,
        }
        for p in positions
    ]
