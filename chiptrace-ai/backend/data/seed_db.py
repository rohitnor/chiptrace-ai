"""
Database Seeder
---------------
Reads generated JSON files and inserts into PostgreSQL.
Run after generate_dataset.py:
    python data/seed_db.py
"""
import json
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import SessionLocal, engine, Base
from models.db_models import (
    Supplier, SupplyChainEvent, DisruptionLog,
    InventoryPosition, MacroRiskSignal
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "generated")


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
            db.add(Supplier(**s))
        db.commit()
        print(f"  ✓ Inserted {len(suppliers_data)} suppliers")

        # Events
        events_data = load_json("events.json")
        for e in events_data:
            db.add(SupplyChainEvent(**{k: v for k, v in e.items() if v is not None}))
        db.commit()
        print(f"  ✓ Inserted {len(events_data)} supply chain events")

        # Disruptions
        disruptions_data = load_json("disruptions.json")
        for d in disruptions_data:
            db.add(DisruptionLog(**d))
        db.commit()
        print(f"  ✓ Inserted {len(disruptions_data)} disruption records")

        # Inventory
        inventory_data = load_json("inventory.json")
        for i in inventory_data:
            db.add(InventoryPosition(**i))
        db.commit()
        print(f"  ✓ Inserted {len(inventory_data)} inventory positions")

        # Macro signals
        macro_data = load_json("macro_signals.json")
        for m in macro_data:
            db.add(MacroRiskSignal(**m))
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
