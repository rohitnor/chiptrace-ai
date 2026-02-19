"""
Synthetic Dataset Generator
---------------------------
Generates realistic automotive semiconductor supply chain data.
Run: python data/generate_dataset.py
Outputs: data/generated/*.json files used by seed_db.py
"""
import json
import uuid
import random
import os
from datetime import datetime, timedelta, date
from faker import Faker

fake = Faker()
random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Config ──────────────────────────────────────────────────────────────────
OEM_IDS = [f"oem_{name}" for name in ["toyota", "volkswagen", "stellantis", "hyundai", "bmw"]]

SUPPLIERS = [
    # Tier-1 chip suppliers
    {"name": "Renesas Electronics", "tier": 1, "country": "Japan", "region": "Asia-Pacific", "node": "40nm", "fin": 78, "geo": 30},
    {"name": "NXP Semiconductors", "tier": 1, "country": "Netherlands", "region": "Europe", "node": "28nm", "fin": 82, "geo": 15},
    {"name": "Infineon Technologies", "tier": 1, "country": "Germany", "region": "Europe", "node": "40nm", "fin": 80, "geo": 12},
    {"name": "STMicroelectronics", "tier": 1, "country": "Switzerland", "region": "Europe", "node": "90nm", "fin": 74, "geo": 18},
    {"name": "Texas Instruments", "tier": 1, "country": "USA", "region": "North America", "node": "28nm", "fin": 88, "geo": 10},
    # Tier-2 OSAT and wafer
    {"name": "TSMC Legacy Division", "tier": 2, "country": "Taiwan", "region": "Asia-Pacific", "node": "28nm", "fin": 91, "geo": 65},
    {"name": "UMC Foundry", "tier": 2, "country": "Taiwan", "region": "Asia-Pacific", "node": "40nm", "fin": 76, "geo": 60},
    {"name": "ASE Group (OSAT)", "tier": 2, "country": "Taiwan", "region": "Asia-Pacific", "node": None, "fin": 72, "geo": 58},
    {"name": "Amkor Technology", "tier": 2, "country": "South Korea", "region": "Asia-Pacific", "node": None, "fin": 70, "geo": 40},
    {"name": "Shin-Etsu Wafers", "tier": 2, "country": "Japan", "region": "Asia-Pacific", "node": None, "fin": 85, "geo": 25},
    # Tier-3 materials
    {"name": "JSR Corporation", "tier": 3, "country": "Japan", "region": "Asia-Pacific", "node": None, "fin": 68, "geo": 22},
    {"name": "Sumitomo Chemical", "tier": 3, "country": "Japan", "region": "Asia-Pacific", "node": None, "fin": 72, "geo": 20},
    {"name": "Air Liquide", "tier": 3, "country": "France", "region": "Europe", "node": None, "fin": 84, "geo": 10},
]

CHIP_SKUS = [
    {"part": "MCU-REN-V850-40NM", "node": "40nm", "app": "ABS Controller"},
    {"part": "MCU-NXP-S32K-28NM", "node": "28nm", "app": "Body Control Module"},
    {"part": "MCU-INF-TC3XX-40NM", "node": "40nm", "app": "Powertrain ECU"},
    {"part": "MCU-STM-SPC5-90NM", "node": "90nm", "app": "Transmission Control"},
    {"part": "MCU-TI-TMS570-28NM", "node": "28nm", "app": "ADAS Safety Controller"},
    {"part": "MOSFET-INF-OptiMOS-40NM", "node": "40nm", "app": "Inverter Drive"},
    {"part": "IGBT-REN-J5-28NM", "node": "28nm", "app": "EV Motor Controller"},
]

DISRUPTION_TYPES = ["fab_capacity", "logistics", "quality", "material", "customs", "weather", "financial"]
EVENT_TYPES = ["wafer_start", "osat_run", "transit", "customs", "goods_receipt"]


def gen_id():
    return str(uuid.uuid4())


def random_date(start_days_ago=365, end_days_ago=0):
    delta = random.randint(end_days_ago, start_days_ago)
    return (datetime.now() - timedelta(days=delta)).date()


# ── Generate Suppliers ────────────────────────────────────────────────────────
def generate_suppliers():
    records = []
    for s in SUPPLIERS:
        records.append({
            "supplier_id": gen_id(),
            "name": s["name"],
            "tier": s["tier"],
            "country": s["country"],
            "region": s["region"],
            "node_specialization": s.get("node"),
            "financial_health_score": s["fin"] + random.uniform(-5, 5),
            "geopolitical_risk_score": s["geo"] + random.uniform(-3, 3),
            "is_single_source": random.random() < 0.25,
            "created_at": datetime.now().isoformat(),
        })
    return records


# ── Generate Supply Events ────────────────────────────────────────────────────
def generate_events(suppliers, n=1500):
    tier1 = [s for s in suppliers if s["tier"] == 1]
    records = []
    for _ in range(n):
        supplier = random.choice(tier1)
        sku = random.choice(CHIP_SKUS)
        planned = random_date(180, 10)
        disruption = random.choice(DISRUPTION_TYPES) if random.random() < 0.35 else None

        if disruption:
            delay = random.randint(2, 35) if disruption != "weather" else random.randint(1, 8)
        else:
            delay = random.randint(-3, 3)

        actual = planned + timedelta(days=delay)
        qty_ordered = random.randint(10000, 100000)
        qty_delivered = int(qty_ordered * random.uniform(0.85, 1.0)) if disruption else qty_ordered
        defect_ppm = random.uniform(50, 400) if disruption == "quality" else random.uniform(0, 50)

        status = "on_time" if delay <= 0 else ("critical" if delay > 14 else "delayed")

        records.append({
            "event_id": gen_id(),
            "supplier_id": supplier["supplier_id"],
            "oem_id": random.choice(OEM_IDS),
            "event_type": random.choice(EVENT_TYPES),
            "chip_part_number": sku["part"],
            "chip_node": sku["node"],
            "chip_application": sku["app"],
            "planned_date": planned.isoformat(),
            "actual_date": actual.isoformat(),
            "delay_days": delay,
            "quantity_ordered": qty_ordered,
            "quantity_delivered": qty_delivered,
            "defect_ppm": round(defect_ppm, 2),
            "event_status": status,
            "disruption_type": disruption,
            "recorded_at": datetime.now().isoformat(),
        })
    return records


# ── Generate Metric Snapshots ─────────────────────────────────────────────────
def generate_metric_snapshots(n_snapshots=30):
    """Generate historical metric snapshots with a simulated disruption event."""
    from services.metric_tree import get_leaf_nodes, propagate_scores

    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    records = []
    for i in range(n_snapshots):
        ts = datetime.now() - timedelta(hours=(n_snapshots - i))
        # Simulate a disruption ramping up mid-period
        disruption_factor = 1.0 if i < 10 else (0.4 if 10 <= i < 20 else 0.7)
        leaf_nodes = get_leaf_nodes()
        leaf_scores = {}
        for leaf in leaf_nodes:
            base = random.uniform(55, 95)
            if "fab_concentration" in leaf or "material" in leaf:
                base *= disruption_factor
            leaf_scores[leaf] = max(5, min(100, base))

        all_scores = propagate_scores(leaf_scores)
        for node_id, data in all_scores.items():
            records.append({
                "snapshot_id": gen_id(),
                "node_id": node_id,
                "node_level": node_id.count("."),
                "node_label": data["label"],
                "score": data["score"],
                "status": data["status"],
                "flagged": data["flagged"],
                "parent_node_id": data["parent"],
                "evaluated_at": ts.isoformat(),
            })
    return records


# ── Generate Disruption Log ───────────────────────────────────────────────────
def generate_disruption_log(n=60):
    records = []
    node_pool = [
        "resilience.fab_concentration.utilization_rate.priority_queue",
        "resilience.material.wafer_supplier_count",
        "delivery.transit.port_congestion",
        "resilience.early_warning.fab_downtime",
        "quality.chip_quality.reject_rate",
        "resilience.demand_shock.die_bank",
        "resilience.logistics_infra.taiwan_strait_exposure",
    ]
    for _ in range(n):
        triggered = random_date(365, 30)
        dtype = random.choice(DISRUPTION_TYPES)
        severity = random.choices(["low", "medium", "high", "critical"], weights=[30, 35, 25, 10])[0]
        pred_res = random.randint(7, 60)
        actual_res = pred_res + random.randint(-7, 10)
        oem_impact = max(0, actual_res - random.randint(5, 15))
        records.append({
            "disruption_id": gen_id(),
            "triggered_node_id": random.choice(node_pool),
            "disruption_type": dtype,
            "severity": severity,
            "oem_impact_days": oem_impact,
            "predicted_resolution_days": pred_res,
            "actual_resolution_days": actual_res,
            "triggered_at": triggered.isoformat(),
            "resolved_at": (triggered + timedelta(days=actual_res)).isoformat(),
            "resolution_action": "Activated buffer / escalated LTA / switched logistics lane",
        })
    return records


# ── Generate Inventory ────────────────────────────────────────────────────────
def generate_inventory(suppliers):
    records = []
    stock_types = ["finished_goods", "wip_osat", "die_bank", "consignment"]
    for s in suppliers:
        for sku in random.sample(CHIP_SKUS, k=random.randint(1, 3)):
            qty = random.randint(5000, 200000)
            doc = round(qty / (random.randint(3000, 8000)), 1)
            records.append({
                "position_id": gen_id(),
                "supplier_id": s["supplier_id"],
                "chip_part_number": sku["part"],
                "stock_type": random.choice(stock_types),
                "quantity_units": qty,
                "days_of_cover": doc,
                "lta_coverage_pct": round(random.uniform(40, 95), 1),
                "spot_exposure_pct": round(random.uniform(2, 30), 1),
                "updated_at": datetime.now().isoformat(),
            })
    return records


# ── Generate Macro Risk Signals ───────────────────────────────────────────────
def generate_macro_signals():
    records = [
        {"signal_type": "typhoon", "region": "Taiwan", "severity": 72, "date": "2024-09-12", "source": "Taiwan CWA typhoon warning", "resolved": True},
        {"signal_type": "fab_downtime", "region": "Taiwan", "severity": 85, "date": "2024-11-03", "source": "TSMC unplanned maintenance at Fab 12", "resolved": False},
        {"signal_type": "export_restriction", "region": "USA", "severity": 60, "date": "2024-10-15", "source": "BIS advanced packaging rule update", "resolved": False},
        {"signal_type": "cny_gap", "region": "China", "severity": 45, "date": "2025-01-20", "source": "Annual Chinese New Year production gap", "resolved": True},
        {"signal_type": "port_congestion", "region": "USA West Coast", "severity": 55, "date": "2024-12-01", "source": "LA/LB labor slowdown", "resolved": True},
        {"signal_type": "yield_crash", "region": "South Korea", "severity": 78, "date": "2024-08-22", "source": "Samsung foundry 28nm yield anomaly", "resolved": True},
    ]
    return [{"signal_id": gen_id(), "signal_type": r["signal_type"], "affected_region": r["region"],
             "severity_score": r["severity"], "signal_date": r["date"], "source": r["source"],
             "resolved": r["resolved"]} for r in records]


if __name__ == "__main__":
    print("Generating synthetic dataset...")
    suppliers = generate_suppliers()
    events = generate_events(suppliers)
    disruptions = generate_disruption_log()
    inventory = generate_inventory(suppliers)
    macro = generate_macro_signals()

    for name, data in [
        ("suppliers", suppliers),
        ("events", events),
        ("disruptions", disruptions),
        ("inventory", inventory),
        ("macro_signals", macro),
    ]:
        path = os.path.join(OUTPUT_DIR, f"{name}.json")
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        print(f"  ✓ {name}: {len(data)} records → {path}")

    print("\nDataset generation complete. Run seed_db.py next.")
