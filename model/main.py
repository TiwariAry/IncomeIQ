from contextlib import asynccontextmanager
from fastapi import FastAPI
import numpy as np

from predictive_model import train_model, predict
from risk_model import train_risk_model, predict_risk
from stress_model import train_vae, generate_scenarios
from xai_model import generate_explanation

models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs on startup — port is already bound by this point
    print("Training models...")
    models["predictive"] = train_model()
    models["risk"] = train_risk_model()
    models["stress"] = train_vae()
    print("All models ready.")
    yield
    # Runs on shutdown (cleanup if needed)
    models.clear()

app = FastAPI(lifespan=lifespan)

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

@app.get("/")
def health():
    return {"status": "ok", "models_loaded": len(models) == 3}

@app.post("/predict")
def predict_api(data: dict):
    prices = np.array(data["prices"])
    return clean_output(predict(models["predictive"], prices))

@app.post("/risk")
def risk_api(data: dict):
    return clean_output(predict_risk(models["risk"], data["features"]))

@app.post("/stress")
def stress_api():
    return clean_output(generate_scenarios(models["stress"]))

@app.post("/explain")
def explain_api(data: dict):
    return clean_output({"aiInsights": generate_explanation(data["metrics"], data["goal"])})