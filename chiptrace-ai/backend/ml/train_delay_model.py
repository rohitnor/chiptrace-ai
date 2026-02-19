"""
Train Delay Prediction Model (XGBoost)
--------------------------------------
Predicts delay_days for a supply chain event given current metric tree state.
Run: python ml/train_delay_model.py
"""
import os
import sys
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "generated")
os.makedirs(MODEL_DIR, exist_ok=True)


def load_training_data():
    events_path = os.path.join(DATA_DIR, "events.json")
    disruptions_path = os.path.join(DATA_DIR, "disruptions.json")

    with open(events_path) as f:
        events = json.load(f)
    with open(disruptions_path) as f:
        disruptions = json.load(f)

    df = pd.DataFrame(events)

    disruption_map = {
        "fab_capacity": 0, "logistics": 1, "quality": 2,
        "material": 3, "customs": 4, "weather": 5, "financial": 6
    }
    node_map = {"28nm": 3, "40nm": 2, "90nm": 1}

    # Feature engineering
    df["disruption_encoded"] = df["disruption_type"].map(disruption_map).fillna(7)
    df["chip_node_risk"] = df["chip_node"].map(node_map).fillna(2)
    df["fill_rate"] = df["quantity_delivered"] / df["quantity_ordered"].replace(0, 1)

    # Simulate metric tree features (in real system, join from metric_snapshots)
    np.random.seed(42)
    n = len(df)
    df["fab_utilization_score"] = np.random.uniform(30, 95, n)
    df["wafer_supplier_score"] = np.random.uniform(40, 90, n)
    df["port_congestion_score"] = np.random.uniform(35, 95, n)
    df["lta_coverage_pct"] = np.random.uniform(40, 95, n)
    df["spot_exposure_pct"] = np.random.uniform(2, 30, n)
    df["macro_signal_severity"] = np.random.uniform(0, 80, n)
    df["die_bank_score"] = np.random.uniform(30, 90, n)
    df["tier1_stock_days"] = np.random.uniform(5, 60, n)
    df["financial_health"] = np.random.uniform(50, 95, n)
    df["bullwhip_index"] = np.random.uniform(20, 85, n)

    features = [
        "fab_utilization_score", "wafer_supplier_score", "port_congestion_score",
        "lta_coverage_pct", "spot_exposure_pct", "macro_signal_severity",
        "die_bank_score", "tier1_stock_days", "financial_health",
        "bullwhip_index", "disruption_encoded", "chip_node_risk", "fill_rate"
    ]
    target = "delay_days"

    X = df[features].values
    y = df[target].values
    return X, y, features


def train():
    print("Loading training data...")
    X, y, features = load_training_data()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )

    print("Training XGBoost delay model...")
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n  Delay Model Metrics:")
    print(f"  RMSE: {rmse:.2f} days")
    print(f"  MAE:  {mae:.2f} days")
    print(f"  R²:   {r2:.3f}")

    # Save model
    model_path = os.path.join(MODEL_DIR, "delay_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    # Save feature names
    meta_path = os.path.join(MODEL_DIR, "delay_model_features.json")
    with open(meta_path, "w") as f:
        json.dump({"features": features, "rmse": rmse, "mae": mae, "r2": r2}, f)

    print(f"  ✓ Model saved: {model_path}")


if __name__ == "__main__":
    train()
