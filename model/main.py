from fastapi import FastAPI
import numpy as np

from predictive_model import train_model, predict
from risk_model import train_risk_model, predict_risk
from stress_model import train_vae, generate_scenarios
from xai_model import generate_explanation

app = FastAPI()

predictive_model = train_model()
risk_model = train_risk_model()
stress_model = train_vae()

# --- Helper to convert NumPy types to Python types for JSON ---
def clean_output(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: clean_output(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_output(v) for v in obj]
    return obj
# --------------------------------------------------------------

@app.post("/predict")
def predict_api(data: dict):
    prices = np.array(data["prices"])
    return clean_output(predict(predictive_model, prices))


@app.post("/risk")
def risk_api(data: dict):
    return clean_output(predict_risk(risk_model, data["features"]))


@app.post("/stress")
def stress_api():
    return clean_output(generate_scenarios(stress_model))


@app.post("/explain")
def explain_api(data: dict):
    return clean_output({"aiInsights": generate_explanation(data["metrics"], data["goal"])})