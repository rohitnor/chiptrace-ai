"""
Train OEM Impact Scoring Model (LightGBM)
------------------------------------------
Predicts downstream OEM production impact in days.
Run: python ml/train_impact_model.py
"""
import os, sys, json, pickle
import numpy as np
import pandas as pd
import lightgbm as lgb
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

    df = pd.DataFrame(disruptions).dropna(subset=["oem_impact_days", "actual_resolution_days"])

    np.random.seed(42)
    n = len(df)
    df["oem_daily_demand_units"] = np.random.randint(1000, 15000, n)
    df["oem_safety_stock_days"] = np.random.randint(5, 30, n)
    df["chip_criticality"] = np.random.choice([1, 2, 3, 4, 5], n, p=[0.05, 0.15, 0.35, 0.30, 0.15])
    df["alternate_chip_available"] = np.random.randint(0, 2, n)
    df["requalification_weeks"] = np.random.randint(8, 52, n)
    df["affected_car_models"] = np.random.randint(1, 8, n)

    features = [
        "predicted_resolution_days", "actual_resolution_days",
        "oem_daily_demand_units", "oem_safety_stock_days",
        "chip_criticality", "alternate_chip_available",
        "requalification_weeks", "affected_car_models"
    ]
    X = df[features].values
    y = df["oem_impact_days"].values
    return X, y, features


def train():
    print("Loading OEM impact training data...")
    X, y, features = load_training_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = lgb.LGBMRegressor(
        num_leaves=63,
        learning_rate=0.05,
        n_estimators=400,
        min_data_in_leaf=20,
        random_state=42,
        verbosity=-1,
    )
    print("Training LightGBM OEM impact model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n  OEM Impact Model Metrics:")
    print(f"  RMSE: {rmse:.2f} days")
    print(f"  MAE:  {mae:.2f} days")
    print(f"  R²:   {r2:.3f}")

    model_path = os.path.join(MODEL_DIR, "impact_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    meta_path = os.path.join(MODEL_DIR, "impact_model_features.json")
    with open(meta_path, "w") as f:
        json.dump({"features": features, "rmse": rmse, "mae": mae, "r2": r2}, f)

    print(f"  ✓ Model saved: {model_path}")


if __name__ == "__main__":
    train()
