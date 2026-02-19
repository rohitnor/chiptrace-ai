import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, Date, Text, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    tier = Column(Integer, nullable=False)           # 0=OEM, 1=Chip, 2=OSAT/Wafer, 3=Chemicals
    country = Column(String(100))
    region = Column(String(50))
    node_specialization = Column(String(50))        # 28nm, 40nm, 90nm
    financial_health_score = Column(Float, default=70.0)
    geopolitical_risk_score = Column(Float, default=30.0)
    is_single_source = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("SupplyChainEvent", back_populates="supplier")
    inventory_positions = relationship("InventoryPosition", back_populates="supplier")


class SupplyChainEvent(Base):
    __tablename__ = "supply_chain_events"

    event_id = Column(String, primary_key=True, default=gen_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.supplier_id"))
    oem_id = Column(String)
    event_type = Column(String(50))                 # wafer_start | osat_run | transit | customs | goods_receipt
    chip_part_number = Column(String(100))
    chip_node = Column(String(20))                  # 28nm, 40nm, 90nm
    chip_application = Column(String(100))          # ABS Controller, ECU, etc
    planned_date = Column(Date)
    actual_date = Column(Date)
    delay_days = Column(Integer, default=0)
    quantity_ordered = Column(Integer)
    quantity_delivered = Column(Integer)
    defect_ppm = Column(Float, default=0.0)
    event_status = Column(String(30))               # on_time | delayed | critical | cancelled
    disruption_type = Column(String(50))            # fab_capacity | logistics | quality | material | customs | weather | financial
    recorded_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="events")


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    snapshot_id = Column(String, primary_key=True, default=gen_uuid)
    node_id = Column(String(100), nullable=False)   # e.g. resilience.fab_concentration.utilization_rate
    node_level = Column(Integer)                    # 0=root, 1, 2, 3, 4=leaf
    node_label = Column(String(200))
    score = Column(Float)                           # 0-100
    status = Column(String(10))                     # green | amber | red
    contributing_supplier_id = Column(String, ForeignKey("suppliers.supplier_id"), nullable=True)
    flagged = Column(Boolean, default=False)
    parent_node_id = Column(String(100), nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow)


class DisruptionLog(Base):
    __tablename__ = "disruption_log"

    disruption_id = Column(String, primary_key=True, default=gen_uuid)
    triggered_node_id = Column(String(100))
    disruption_type = Column(String(50))
    severity = Column(String(20))                   # low | medium | high | critical
    oem_impact_days = Column(Integer, nullable=True)
    predicted_resolution_days = Column(Integer, nullable=True)
    actual_resolution_days = Column(Integer, nullable=True)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_action = Column(Text, nullable=True)


class InventoryPosition(Base):
    __tablename__ = "inventory_positions"

    position_id = Column(String, primary_key=True, default=gen_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.supplier_id"))
    chip_part_number = Column(String(100))
    stock_type = Column(String(50))                 # finished_goods | wip_osat | die_bank | consignment
    quantity_units = Column(Integer)
    days_of_cover = Column(Float)
    lta_coverage_pct = Column(Float, default=0.0)
    spot_exposure_pct = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="inventory_positions")


class MacroRiskSignal(Base):
    __tablename__ = "macro_risk_signals"

    signal_id = Column(String, primary_key=True, default=gen_uuid)
    signal_type = Column(String(50))                # typhoon | fab_downtime | export_restriction | cny_gap | port_congestion | yield_crash
    affected_region = Column(String(100))
    severity_score = Column(Float)                  # 0-100
    signal_date = Column(Date)
    source = Column(String(200))
    resolved = Column(Boolean, default=False)
