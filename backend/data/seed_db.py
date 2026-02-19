"""
Database Seeder
---------------
Reads generated JSON files and inserts into PostgreSQL (or SQLite for local dev).
Run after generate_dataset.py:
    python data/seed_db.py
"""
import json
import os
import sys
from datetime import datetime, date
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import SessionLocal, engine, Base, DATABASE_URL
from models.db_models import (
    Supplier, SupplyChainEvent, DisruptionLog,
    InventoryPosition, MacroRiskSignal
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "generated")
_IS_SQLITE = DATABASE_URL.startswith("sqlite")


def _parse_dt(val):
    """Convert an ISO datetime string to a Python datetime (for SQLite compat)."""
    if val is None or not isinstance(val, str):
        return val
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            pass
    return val


def _parse_date(val):
    """Convert an ISO date string to a Python date (for SQLite compat)."""
    if val is None or not isinstance(val, str):
        return val
    try:
        return date.fromisoformat(val)
    except ValueError:
        return val


def _fix_supplier(row):
    if not _IS_SQLITE:
        return row
    row = dict(row)
    for f in ("created_at",):
        if f in row:
            row[f] = _parse_dt(row[f])
    return row


def _fix_event(row):
    if not _IS_SQLITE:
        return row
    row = dict(row)
    for f in ("recorded_at",):
        if f in row:
            row[f] = _parse_dt(row[f])
    for f in ("planned_date", "actual_date"):
        if f in row:
            row[f] = _parse_date(row[f])
    return row


def _fix_disruption(row):
    if not _IS_SQLITE:
        return row
    row = dict(row)
    for f in ("triggered_at", "resolved_at"):
        if f in row:
            row[f] = _parse_dt(row[f])
    return row


def _fix_inventory(row):
    if not _IS_SQLITE:
        return row
    row = dict(row)
    for f in ("updated_at",):
        if f in row:
            row[f] = _parse_dt(row[f])
    return row


def _fix_macro(row):
    if not _IS_SQLITE:
        return row
    row = dict(row)
    for f in ("signal_date",):
        if f in row:
            row[f] = _parse_date(row[f])
    return row


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"  ⚠ File not found: {path}. Run generate_dataset.py first.")
        return []
    with open(path) as f:
        return json.load(f)


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(MacroRiskSignal).delete()
        db.query(InventoryPosition).delete()
        db.query(DisruptionLog).delete()
        db.query(SupplyChainEvent).delete()
        db.query(Supplier).delete()
        db.commit()
        print("Cleared existing data.")

        # Suppliers
        suppliers_data = load_json("suppliers.json")
        for s in suppliers_data:
            db.add(Supplier(**_fix_supplier(s)))
        db.commit()
        print(f"  ✓ Inserted {len(suppliers_data)} suppliers")

        # Events
        events_data = load_json("events.json")
        for e in events_data:
            db.add(SupplyChainEvent(**{k: v for k, v in _fix_event(e).items() if v is not None}))
        db.commit()
        print(f"  ✓ Inserted {len(events_data)} supply chain events")

        # Disruptions
        disruptions_data = load_json("disruptions.json")
        for d in disruptions_data:
            db.add(DisruptionLog(**_fix_disruption(d)))
        db.commit()
        print(f"  ✓ Inserted {len(disruptions_data)} disruption records")

        # Inventory
        inventory_data = load_json("inventory.json")
        for i in inventory_data:
            db.add(InventoryPosition(**_fix_inventory(i)))
        db.commit()
        print(f"  ✓ Inserted {len(inventory_data)} inventory positions")

        # Macro signals
        macro_data = load_json("macro_signals.json")
        for m in macro_data:
            db.add(MacroRiskSignal(**_fix_macro(m)))
        db.commit()
        print(f"  ✓ Inserted {len(macro_data)} macro risk signals")

        print("\n✅ Database seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
