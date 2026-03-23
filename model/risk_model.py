import pandas as pd
import numpy as np
from xgboost import XGBRegressor

def train_risk_model():
    df = pd.read_csv("data/risk_profiler_training.csv")

    X = df.drop(columns=["Risk_Score"])
    y = df["Risk_Score"]

    model = XGBRegressor(n_estimators=200, max_depth=6)
    model.fit(X, y)

    return model


def predict_risk(model, features):
    features = np.array(features).reshape(1, -1)
    risk_score = float(model.predict(features)[0])

    return {
        "riskScore": round(risk_score, 2)
    }