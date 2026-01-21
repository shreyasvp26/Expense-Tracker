import joblib
import re
import os

# Use environment variables with fallback to default paths
MODEL_PATH = os.getenv("MODEL_PATH", "model/merchant_model.pkl")
VECTORIZER_PATH = os.getenv("VECTORIZER_PATH", "model/vectorizer.pkl")

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    return text

def predict_category(merchant: str):
    merchant = clean_text(merchant)
    vec = vectorizer.transform([merchant])
    probs = model.predict_proba(vec)[0]

    if max(probs) < 0.20:
        return "Other"

    return model.classes_[probs.argmax()]
