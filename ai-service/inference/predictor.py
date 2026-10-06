import os
import sys
import joblib
from typing import Dict, Any, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.text_cleaner import clean_text

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
CLASSIFIER_PATH = os.path.join(MODELS_DIR, "classifier.joblib")
SEVERITY_PATH = os.path.join(MODELS_DIR, "severity.joblib")

class TRACEMLPredictor:
    def __init__(self):
        self.category_model = None
        self.severity_model = None
        self.is_loaded = False
        self.load_models()

    def load_models(self):
        try:
            if os.path.exists(CLASSIFIER_PATH) and os.path.exists(SEVERITY_PATH):
                self.category_model = joblib.load(CLASSIFIER_PATH)
                self.severity_model = joblib.load(SEVERITY_PATH)
                self.is_loaded = True
                print("[INFO] AI Models loaded successfully into memory.")
            else:
                print("[WARN] Model files not found. Run train_classifier.py first.")
        except Exception as e:
            print(f"[ERROR] Failed to load models: {e}")

    def predict_category(self, text: str) -> Dict[str, Any]:
        if not self.is_loaded or self.category_model is None:
            return {"category": "OTHER", "confidence": 0.5, "model_version": "fallback"}

        cleaned = clean_text(text)
        probs = self.category_model.predict_proba([cleaned])[0]
        classes = self.category_model.classes_

        top_idx = probs.argmax()
        top_category = classes[top_idx]
        top_confidence = float(probs[top_idx])

        # Top 3 alternative predictions
        ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)[:3]
        alternatives = [{"category": c, "confidence": round(float(p), 4)} for c, p in ranked]

        return {
            "category": top_category,
            "confidence": round(top_confidence, 4),
            "alternatives": alternatives,
            "model_version": "1.0.0-tfidf-logreg"
        }

    def predict_severity(self, text: str, category: str = None) -> Dict[str, Any]:
        if not self.is_loaded or self.severity_model is None:
            return {"severity": "MEDIUM", "confidence": 0.5, "model_version": "fallback"}

        cleaned = clean_text(text)
        probs = self.severity_model.predict_proba([cleaned])[0]
        classes = self.severity_model.classes_

        top_idx = probs.argmax()
        top_severity = classes[top_idx]
        top_confidence = float(probs[top_idx])

        # If category is violent robbery or assault, bias toward at least HIGH
        if category in ["ROBBERY", "ASSAULT"] and top_severity in ["LOW", "MEDIUM"]:
            top_severity = "HIGH"
            top_confidence = max(top_confidence, 0.85)

        return {
            "severity": top_severity,
            "confidence": round(top_confidence, 4),
            "model_version": "1.0.0-tfidf-logreg"
        }

predictor = TRACEMLPredictor()
