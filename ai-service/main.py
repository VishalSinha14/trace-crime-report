"""
TRACE AI Service - FastAPI
Technology for Reporting, Analysis & Crime Evaluation

Provides ML endpoints for:
- Incident classification (NLP)
- Severity estimation
- Multi-model confidence scoring
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import os
import sys

# Configure UTF-8 encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from inference.predictor import predictor

app = FastAPI(
    title="TRACE AI Service",
    description="AI-powered incident classification and severity estimation for TRACE",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ─────────────────────────────────────────────────────────────────
class ClassifyRequest(BaseModel):
    description: str = Field(..., min_length=5, description="Incident narrative text")

class SeverityRequest(BaseModel):
    description: str = Field(..., min_length=5, description="Incident narrative text")
    category: Optional[str] = Field(None, description="Optional incident category")

class AnalyzeRequest(BaseModel):
    description: str = Field(..., min_length=5, description="Incident narrative text")
    category: Optional[str] = Field(None, description="Optional user-selected category")

class BatchAnalyzeRequest(BaseModel):
    descriptions: List[str]

# ─── Health Check ────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "trace-ai-service",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": predictor.is_loaded,
        "model_version": "1.0.0-tfidf-logreg",
    }

# ─── API Root ────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "TRACE AI Service",
        "version": "1.0.0",
        "models_loaded": predictor.is_loaded,
        "endpoints": {
            "health": "/health",
            "classify": "/predict/classification",
            "severity": "/predict/severity",
            "analyze": "/predict/analyze",
        },
    }

# ─── Classification Endpoint ─────────────────────────────────────────────────
@app.post("/predict/classification")
async def predict_classification(data: ClassifyRequest):
    if not data.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")
    result = predictor.predict_category(data.description)
    return result

# ─── Severity Endpoint ───────────────────────────────────────────────────────
@app.post("/predict/severity")
async def predict_severity(data: SeverityRequest):
    if not data.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")
    result = predictor.predict_severity(data.description, data.category)
    return result

# ─── Unified Incident Analysis Endpoint ──────────────────────────────────────
@app.post("/predict/analyze")
async def analyze_incident(data: AnalyzeRequest):
    if not data.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")

    cat_result = predictor.predict_category(data.description)
    assigned_category = data.category or cat_result["category"]
    sev_result = predictor.predict_severity(data.description, assigned_category)

    return {
        "category": cat_result["category"],
        "category_confidence": cat_result["confidence"],
        "alternatives": cat_result.get("alternatives", []),
        "severity": sev_result["severity"],
        "severity_confidence": sev_result["confidence"],
        "model_version": cat_result["model_version"],
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", "8000")),
        reload=False,
    )
