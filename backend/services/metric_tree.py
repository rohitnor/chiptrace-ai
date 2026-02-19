"""
Metric Tree Engine
------------------
Builds the full supply chain metric tree, scores every node,
propagates failures upward, and returns structured alerts.
"""
import networkx as nx
from datetime import datetime
from typing import Dict, Any, List

# ── Tree Definition ────────────────────────────────────────────────────────────
# node_id → { label, parent, weight, leaf }
METRIC_TREE_DEFINITION = {
    # Root
    "root": {"label": "Supply Chain Health Score", "parent": None, "weight": 1.0, "leaf": False},

    # L1 pillars
    "delivery": {"label": "Delivery Timeliness", "parent": "root", "weight": 0.35, "leaf": False},
    "quality": {"label": "Order Accuracy & Quality", "parent": "root", "weight": 0.30, "leaf": False},
    "resilience": {"label": "Supply Resilience", "parent": "root", "weight": 0.25, "leaf": False},
    "compliance": {"label": "Regulatory & Compliance Risk", "parent": "root", "weight": 0.10, "leaf": False},

    # ── DELIVERY L2
    "delivery.lead_time": {"label": "Supplier Lead Time", "parent": "delivery", "weight": 0.40, "leaf": False},
    "delivery.transit": {"label": "Transit & Logistics", "parent": "delivery", "weight": 0.35, "leaf": False},
    "delivery.oem_readiness": {"label": "OEM Line Readiness", "parent": "delivery", "weight": 0.25, "leaf": False},

    # DELIVERY L3 leaves
    "delivery.lead_time.wafer_cycle": {"label": "Wafer Fabrication Cycle Time", "parent": "delivery.lead_time", "weight": 0.35, "leaf": True},
    "delivery.lead_time.osat_duration": {"label": "OSAT Assembly & Test Duration", "parent": "delivery.lead_time", "weight": 0.30, "leaf": True},
    "delivery.lead_time.tier2_arrival": {"label": "Tier-2 Raw Material Arrival Lag", "parent": "delivery.lead_time", "weight": 0.20, "leaf": True},
    "delivery.lead_time.tier3_chemical": {"label": "Tier-3 Chemical/Gas Supply Delay", "parent": "delivery.lead_time", "weight": 0.15, "leaf": True},

    "delivery.transit.port_congestion": {"label": "Port Congestion Index", "parent": "delivery.transit", "weight": 0.35, "leaf": True},
    "delivery.transit.air_freight": {"label": "Air Freight Availability", "parent": "delivery.transit", "weight": 0.25, "leaf": True},
    "delivery.transit.incoterms": {"label": "Incoterms Compliance Rate", "parent": "delivery.transit", "weight": 0.20, "leaf": True},
    "delivery.transit.last_mile": {"label": "Last-Mile Delivery to OEM Plant", "parent": "delivery.transit", "weight": 0.20, "leaf": True},

    "delivery.oem_readiness.kanban": {"label": "Kanban Signal Accuracy", "parent": "delivery.oem_readiness", "weight": 0.40, "leaf": True},
    "delivery.oem_readiness.dock_to_stock": {"label": "Dock-to-Stock Processing Time", "parent": "delivery.oem_readiness", "weight": 0.30, "leaf": True},
    "delivery.oem_readiness.buffer": {"label": "Line-Side Buffer Stock (days)", "parent": "delivery.oem_readiness", "weight": 0.30, "leaf": True},

    # ── QUALITY L2
    "quality.chip_quality": {"label": "Chip-Level Quality", "parent": "quality", "weight": 0.45, "leaf": False},
    "quality.traceability": {"label": "Batch & Traceability", "parent": "quality", "weight": 0.30, "leaf": False},
    "quality.demand_signal": {"label": "Demand Signal Accuracy", "parent": "quality", "weight": 0.25, "leaf": False},

    # QUALITY L3 leaves
    "quality.chip_quality.reject_rate": {"label": "Incoming Inspection Reject Rate (ppm)", "parent": "quality.chip_quality", "weight": 0.30, "leaf": True},
    "quality.chip_quality.aec_q100": {"label": "AEC-Q100 Electrical Parameter Drift", "parent": "quality.chip_quality", "weight": 0.30, "leaf": True},
    "quality.chip_quality.esd_damage": {"label": "ESD Damage Rate During Transit", "parent": "quality.chip_quality", "weight": 0.20, "leaf": True},
    "quality.chip_quality.counterfeit": {"label": "Counterfeit Component Detection Rate", "parent": "quality.chip_quality", "weight": 0.20, "leaf": True},

    "quality.traceability.lot_score": {"label": "Lot Traceability Score (fab→OEM)", "parent": "quality.traceability", "weight": 0.40, "leaf": True},
    "quality.traceability.date_code": {"label": "Date Code Mismatch %", "parent": "quality.traceability", "weight": 0.30, "leaf": True},
    "quality.traceability.coc": {"label": "Certificate of Conformance Completeness", "parent": "quality.traceability", "weight": 0.30, "leaf": True},

    "quality.demand_signal.forecast_deviation": {"label": "Forecast vs Actual Deviation", "parent": "quality.demand_signal", "weight": 0.40, "leaf": True},
    "quality.demand_signal.bullwhip": {"label": "Bullwhip Effect Index", "parent": "quality.demand_signal", "weight": 0.35, "leaf": True},
    "quality.demand_signal.ecn_lag": {"label": "ECN Response Lag", "parent": "quality.demand_signal", "weight": 0.25, "leaf": True},

    # ── RESILIENCE L2
    "resilience.fab_concentration": {"label": "Fab Concentration & Capacity Risk", "parent": "resilience", "weight": 0.22, "leaf": False},
    "resilience.osat": {"label": "OSAT Packaging & Test Vulnerability", "parent": "resilience", "weight": 0.18, "leaf": False},
    "resilience.material": {"label": "Material & Sub-Component Traceability", "parent": "resilience", "weight": 0.20, "leaf": False},
    "resilience.demand_shock": {"label": "Demand Shock Absorption Capacity", "parent": "resilience", "weight": 0.18, "leaf": False},
    "resilience.logistics_infra": {"label": "Logistics Infrastructure Resilience", "parent": "resilience", "weight": 0.12, "leaf": False},
    "resilience.early_warning": {"label": "Early Warning Signals", "parent": "resilience", "weight": 0.10, "leaf": False},

    # RESILIENCE L3 — Fab Concentration
    "resilience.fab_concentration.geo_index": {"label": "Geographic Fab Concentration Index", "parent": "resilience.fab_concentration", "weight": 0.35, "leaf": False},
    "resilience.fab_concentration.node_obsolescence": {"label": "Node Obsolescence Risk", "parent": "resilience.fab_concentration", "weight": 0.35, "leaf": False},
    "resilience.fab_concentration.utilization_rate": {"label": "Fab Utilization Rate", "parent": "resilience.fab_concentration", "weight": 0.30, "leaf": False},

    # L4 leaves — Fab Concentration
    "resilience.fab_concentration.geo_index.taiwan_pct": {"label": "% Volume from Taiwan Fabs", "parent": "resilience.fab_concentration.geo_index", "weight": 0.40, "leaf": True},
    "resilience.fab_concentration.geo_index.china_pct": {"label": "% Volume from China Fabs (tariff exposure)", "parent": "resilience.fab_concentration.geo_index", "weight": 0.35, "leaf": True},
    "resilience.fab_concentration.geo_index.japan_korea_pct": {"label": "% Volume from Japan/Korea Fabs", "parent": "resilience.fab_concentration.geo_index", "weight": 0.25, "leaf": True},

    "resilience.fab_concentration.node_obsolescence.retirement_timeline": {"label": "Legacy Node Capacity Retirement Timeline", "parent": "resilience.fab_concentration.node_obsolescence", "weight": 0.40, "leaf": True},
    "resilience.fab_concentration.node_obsolescence.active_fabs_count": {"label": "Active Fabs Running Target Node", "parent": "resilience.fab_concentration.node_obsolescence", "weight": 0.35, "leaf": True},
    "resilience.fab_concentration.node_obsolescence.capex_trend": {"label": "Fab Capex Investment Trend for Node", "parent": "resilience.fab_concentration.node_obsolescence", "weight": 0.25, "leaf": True},

    "resilience.fab_concentration.utilization_rate.load_pct": {"label": "Current Fab Load vs Rated Capacity %", "parent": "resilience.fab_concentration.utilization_rate", "weight": 0.40, "leaf": True},
    "resilience.fab_concentration.utilization_rate.priority_queue": {"label": "Priority Queue Position (Auto vs Consumer)", "parent": "resilience.fab_concentration.utilization_rate", "weight": 0.35, "leaf": True},
    "resilience.fab_concentration.utilization_rate.wafer_start_flex": {"label": "Wafer Start Flexibility (Surge Capacity)", "parent": "resilience.fab_concentration.utilization_rate", "weight": 0.25, "leaf": True},

    # L3 leaves — OSAT
    "resilience.osat.package_concentration": {"label": "Package Type Concentration", "parent": "resilience.osat", "weight": 0.35, "leaf": True},
    "resilience.osat.test_capacity": {"label": "ATE Test Capacity Bottleneck", "parent": "resilience.osat", "weight": 0.35, "leaf": True},
    "resilience.osat.financial_health": {"label": "OSAT Financial Health Index", "parent": "resilience.osat", "weight": 0.30, "leaf": True},

    # L3 leaves — Material
    "resilience.material.wafer_supplier_count": {"label": "Silicon Wafer Supplier Depth", "parent": "resilience.material", "weight": 0.28, "leaf": True},
    "resilience.material.substrate_concentration": {"label": "Substrate & Leadframe Concentration", "parent": "resilience.material", "weight": 0.22, "leaf": True},
    "resilience.material.photoresist_exposure": {"label": "Photoresist Supply (JSR/Shin-Etsu)", "parent": "resilience.material", "weight": 0.18, "leaf": True},
    "resilience.material.specialty_gas": {"label": "Specialty Gas (NF3/WF6) Supplier Count", "parent": "resilience.material", "weight": 0.18, "leaf": True},
    "resilience.material.mask_set_risk": {"label": "IP & Mask Set EOL Risk", "parent": "resilience.material", "weight": 0.14, "leaf": True},

    # L3 leaves — Demand Shock
    "resilience.demand_shock.tier1_finished_goods": {"label": "Tier-1 Finished Goods Days of Cover", "parent": "resilience.demand_shock", "weight": 0.25, "leaf": True},
    "resilience.demand_shock.wip_buffer": {"label": "Tier-2 WIP Buffer at OSAT", "parent": "resilience.demand_shock", "weight": 0.20, "leaf": True},
    "resilience.demand_shock.die_bank": {"label": "Tier-2 Die Bank at Fab", "parent": "resilience.demand_shock", "weight": 0.20, "leaf": True},
    "resilience.demand_shock.lta_utilization": {"label": "LTA Flex Clause Utilization Status", "parent": "resilience.demand_shock", "weight": 0.20, "leaf": True},
    "resilience.demand_shock.spot_dependency": {"label": "Spot Market Dependency %", "parent": "resilience.demand_shock", "weight": 0.15, "leaf": True},

    # L3 leaves — Logistics Infrastructure
    "resilience.logistics_infra.carrier_concentration": {"label": "Carrier Concentration Risk", "parent": "resilience.logistics_infra", "weight": 0.25, "leaf": True},
    "resilience.logistics_infra.taiwan_strait_exposure": {"label": "Taiwan Strait Transit Exposure %", "parent": "resilience.logistics_infra", "weight": 0.25, "leaf": True},
    "resilience.logistics_infra.red_sea_impact": {"label": "Red Sea/Suez Rerouting Lead Time Impact", "parent": "resilience.logistics_infra", "weight": 0.20, "leaf": True},
    "resilience.logistics_infra.customs_clearance": {"label": "Avg Customs Clearance Time by Country", "parent": "resilience.logistics_infra", "weight": 0.15, "leaf": True},
    "resilience.logistics_infra.tariff_exposure": {"label": "Tariff Rate Change Exposure (US-China)", "parent": "resilience.logistics_infra", "weight": 0.15, "leaf": True},

    # L3 leaves — Early Warning
    "resilience.early_warning.fab_downtime": {"label": "Unplanned Fab Downtime Events (90d)", "parent": "resilience.early_warning", "weight": 0.35, "leaf": True},
    "resilience.early_warning.yield_crash": {"label": "Fab Yield Crash Signals (>5% drop)", "parent": "resilience.early_warning", "weight": 0.30, "leaf": True},
    "resilience.early_warning.supplier_financial_stress": {"label": "Tier-2/3 Supplier Financial Stress", "parent": "resilience.early_warning", "weight": 0.20, "leaf": True},
    "resilience.early_warning.macro_overlay": {"label": "Macro Event Risk Overlay (Typhoon/CNY)", "parent": "resilience.early_warning", "weight": 0.15, "leaf": True},

    # ── COMPLIANCE L2 leaves
    "compliance.export_control": {"label": "Export Control Exposure (ITAR/EAR)", "parent": "compliance", "weight": 0.35, "leaf": True},
    "compliance.reach_rohs": {"label": "REACH/RoHS Material Compliance %", "parent": "compliance", "weight": 0.30, "leaf": True},
    "compliance.conflict_mineral": {"label": "Conflict Mineral Audit Score (3TG)", "parent": "compliance", "weight": 0.20, "leaf": True},
    "compliance.carbon_footprint": {"label": "Carbon Footprint per Chip (Scope 3)", "parent": "compliance", "weight": 0.15, "leaf": True},
}

RED_THRESHOLD = 40
AMBER_THRESHOLD = 70


def compute_status(score: float) -> str:
    if score >= AMBER_THRESHOLD:
        return "green"
    elif score >= RED_THRESHOLD:
        return "amber"
    return "red"


def build_graph() -> nx.DiGraph:
    G = nx.DiGraph()
    for node_id, meta in METRIC_TREE_DEFINITION.items():
        G.add_node(node_id, **meta)
    for node_id, meta in METRIC_TREE_DEFINITION.items():
        if meta["parent"]:
            G.add_edge(meta["parent"], node_id, weight=meta["weight"])
    return G


def get_leaf_nodes() -> List[str]:
    return [n for n, d in METRIC_TREE_DEFINITION.items() if d["leaf"]]


def propagate_scores(leaf_scores: Dict[str, float]) -> Dict[str, Any]:
    """
    Given leaf scores (node_id → score 0-100), propagate up the tree.
    Returns all node scores including internal nodes.
    """
    G = build_graph()
    scores = dict(leaf_scores)

    # Bottom-up traversal using reverse topological sort
    for node in reversed(list(nx.topological_sort(G))):
        if METRIC_TREE_DEFINITION[node]["leaf"]:
            if node not in scores:
                scores[node] = 75.0  # default if missing
            continue
        children = list(G.successors(node))
        if not children:
            continue
        total_weight = sum(METRIC_TREE_DEFINITION[c]["weight"] for c in children)
        weighted_sum = sum(
            scores.get(c, 75.0) * METRIC_TREE_DEFINITION[c]["weight"]
            for c in children
        )
        scores[node] = weighted_sum / total_weight if total_weight else 75.0

    result = {}
    for node_id, score in scores.items():
        meta = METRIC_TREE_DEFINITION[node_id]
        result[node_id] = {
            "node_id": node_id,
            "label": meta["label"],
            "parent": meta["parent"],
            "score": round(score, 2),
            "status": compute_status(score),
            "leaf": meta["leaf"],
            "weight": meta["weight"],
            "flagged": compute_status(score) == "red",
        }
    return result


def trace_root_cause(all_scores: Dict[str, Any], start: str = "root") -> List[Dict]:
    """
    Walk the tree from root, always following the child with the lowest score.
    Returns path from root to the most critical leaf.
    """
    path = []
    current = start
    while True:
        node_data = all_scores.get(current)
        if not node_data:
            break
        path.append(node_data)
        if METRIC_TREE_DEFINITION[current]["leaf"]:
            break
        # Find child with lowest score
        G = build_graph()
        children = list(G.successors(current))
        if not children:
            break
        worst_child = min(children, key=lambda c: all_scores.get(c, {}).get("score", 100))
        current = worst_child
    return path


def get_all_alerts(all_scores: Dict[str, Any]) -> List[Dict]:
    """Return all RED nodes with their root cause traces."""
    alerts = []
    for node_id, data in all_scores.items():
        if data["status"] == "red":
            trace = trace_root_cause(all_scores, start=node_id) if data["leaf"] else []
            alerts.append({
                "node_id": node_id,
                "label": data["label"],
                "score": data["score"],
                "trace": [t["node_id"] for t in trace],
                "flagged_at": datetime.utcnow().isoformat(),
            })
    return alerts
