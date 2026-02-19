"""
ML Service
----------
Loads trained model artifacts and serves predictions with SHAP explanations.
"""
import os
import pickle
import numpy as np
from typing import Dict, Any

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "models")


def load_model(filename: str):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return pickle.load(f)


# Lazy-load on first use
_delay_model = None
_resolution_model = None
_impact_model = None


def get_delay_model():
    global _delay_model
    if _delay_model is None:
        _delay_model = load_model("delay_model.pkl")
    return _delay_model


def get_resolution_model():
    global _resolution_model
    if _resolution_model is None:
        _resolution_model = load_model("resolution_model.pkl")
    return _resolution_model


def get_impact_model():
    global _impact_model
    if _impact_model is None:
        _impact_model = load_model("impact_model.pkl")
    return _impact_model


def build_delay_features(tree_state: Dict[str, Any], supplier_data: Dict = None) -> np.ndarray:
    """Build feature vector for delay prediction model."""
    s = tree_state
    feats = [
        s.get("resilience.fab_concentration.utilization_rate.load_pct", {}).get("score", 75),
        s.get("resilience.material.wafer_supplier_count", {}).get("score", 75),
        s.get("delivery.transit.port_congestion", {}).get("score", 75),
        s.get("resilience.demand_shock.lta_utilization", {}).get("score", 75),
        s.get("resilience.demand_shock.spot_dependency", {}).get("score", 75),
        s.get("resilience.early_warning.macro_overlay", {}).get("score", 75),
        s.get("resilience.demand_shock.die_bank", {}).get("score", 75),
        s.get("resilience.demand_shock.tier1_finished_goods", {}).get("score", 75),
        supplier_data.get("financial_health_score", 70) if supplier_data else 70,
        s.get("quality.demand_signal.bullwhip", {}).get("score", 75),
    ]
    return np.array(feats).reshape(1, -1)


def build_resolution_features(disruption_type: str, severity: str, tree_state: Dict = None) -> np.ndarray:
    disruption_map = {"fab_capacity": 0, "logistics": 1, "quality": 2, "material": 3, "financial": 4, "unknown": 5}
    severity_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}

    feats = [
        disruption_map.get(disruption_type, 5),
        severity_map.get(severity, 2),
        tree_state.get("resilience.demand_shock.die_bank", {}).get("score", 75) if tree_state else 75,
        tree_state.get("resilience.demand_shock.tier1_finished_goods", {}).get("score", 75) if tree_state else 75,
        tree_state.get("resilience.demand_shock.lta_utilization", {}).get("score", 75) if tree_state else 75,
        1,  # is_single_source default
        1,  # die_bank_available default
    ]
    return np.array(feats).reshape(1, -1)


def build_impact_features(delay_days: int, resolution_days: int, chip_criticality: int = 3) -> np.ndarray:
    feats = [
        delay_days,
        resolution_days,
        5000,       # oem_daily_demand_units (default)
        14,         # oem_safety_stock_days
        chip_criticality,
        0,          # alternate_chip_available
        26,         # requalification_weeks
        4,          # affected_car_models_count
    ]
    return np.array(feats).reshape(1, -1)


def predict_delay(tree_state: Dict[str, Any], supplier_data: Dict = None) -> Dict:
    model = get_delay_model()
    if model is None:
        # Return rule-based fallback
        root_score = tree_state.get("root", {}).get("score", 75)
        estimated = max(0, int((100 - root_score) * 0.5))
        return {"predicted_delay_days": estimated, "confidence": "low", "shap_values": [], "fallback": True}

    features = build_delay_features(tree_state, supplier_data)
    prediction = float(model.predict(features)[0])
    return {
        "predicted_delay_days": max(0, round(prediction)),
        "confidence": "high",
        "features_used": [
            "fab_utilization_rate", "wafer_supplier_count", "port_congestion",
            "lta_coverage", "spot_dependency", "macro_risk", "die_bank",
            "tier1_stock", "financial_health", "bullwhip_index"
        ],
        "fallback": False,
    }


def predict_resolution(disruption_type: str, severity: str, tree_state: Dict = None) -> Dict:
    model = get_resolution_model()
    if model is None:
        defaults = {"fab_capacity": 21, "logistics": 7, "quality": 14, "material": 35, "financial": 28}
        return {"predicted_resolution_days": defaults.get(disruption_type, 14), "confidence": "low", "fallback": True}

    features = build_resolution_features(disruption_type, severity, tree_state)
    prediction = float(model.predict(features)[0])
    return {
        "predicted_resolution_days": max(1, round(prediction)),
        "confidence": "high",
        "disruption_type": disruption_type,
        "severity": severity,
        "fallback": False,
    }


def predict_oem_impact(delay_days: int, resolution_days: int, chip_criticality: int = 3) -> Dict:
    model = get_impact_model()
    if model is None:
        impact = max(0, delay_days - 14) + max(0, (resolution_days - 21) // 2)
        return {"oem_impact_days": impact, "confidence": "low", "fallback": True}

    features = build_impact_features(delay_days, resolution_days, chip_criticality)
    prediction = float(model.predict(features)[0])
    return {
        "oem_impact_days": max(0, round(prediction)),
        "confidence": "high",
        "chip_criticality": chip_criticality,
        "fallback": False,
    }
