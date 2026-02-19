"""
Train Resolution Timeline Model (Random Forest)
------------------------------------------------
Predicts how many days until a disruption resolves.
Run: python ml/train_resolution_model.py
"""
import os, sys, json, pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "generated")
os.makedirs(MODEL_DIR, exist_ok=True)


def load_training_data():
    path = os.path.join(DATA_DIR, "disruptions.json")
    with open(path) as f:
        disruptions = json.load(f)

    df = pd.DataFrame(disruptions)
    df = df.dropna(subset=["actual_resolution_days"])

    disruption_map = {"fab_capacity": 0, "logistics": 1, "quality": 2, "material": 3, "customs": 4, "weather": 5, "financial": 6}
    severity_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}

    df["disruption_encoded"] = df["disruption_type"].map(disruption_map).fillna(7)
    df["severity_encoded"] = df["severity"].map(severity_map).fillna(2)

    np.random.seed(42)
    n = len(df)
    df["die_bank_score"] = np.random.uniform(20, 95, n)
    df["tier1_stock_days"] = np.random.uniform(5, 60, n)
    df["lta_flex_available"] = np.random.randint(0, 2, n)
    df["is_single_source"] = np.random.randint(0, 2, n)
    df["macro_signal_active"] = np.random.randint(0, 2, n)
    df["node_depth"] = np.random.randint(2, 5, n)

    features = [
        "disruption_encoded", "severity_encoded", "die_bank_score",
        "tier1_stock_days", "lta_flex_available", "is_single_source",
        "macro_signal_active", "node_depth"
    ]
    X = df[features].values
    y = df["actual_resolution_days"].values
    return X, y, features


def train():
    print("Loading disruption training data...")
    X, y, features = load_training_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    print("Training Random Forest resolution model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n  Resolution Model Metrics:")
    print(f"  RMSE: {rmse:.2f} days")
    print(f"  MAE:  {mae:.2f} days")
    print(f"  R²:   {r2:.3f}")

    model_path = os.path.join(MODEL_DIR, "resolution_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    meta_path = os.path.join(MODEL_DIR, "resolution_model_features.json")
    with open(meta_path, "w") as f:
        json.dump({"features": features, "rmse": rmse, "mae": mae, "r2": r2}, f)

    print(f"  ✓ Model saved: {model_path}")


if __name__ == "__main__":
    train()
