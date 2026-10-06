"""
TRACE Model Training Pipeline
Trains:
1. TF-IDF + Calibrated Logistic Regression for Incident Category Classification
2. TF-IDF + Logistic Regression for Incident Severity Estimation
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

# Ensure module path resolution and UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.text_cleaner import clean_text

DATA_TEMPLATES = {
    "THEFT_SNATCHING": {
        "severity": "MEDIUM",
        "phrases": [
            "Someone snatched my mobile phone while I was walking on {place}.",
            "My handbag was stolen from the seat at a restaurant on {place}.",
            "Two guys on a motorcycle snatched my gold chain near {place}.",
            "Wallet pickpocketed in the crowded market near {place}.",
            "My smartphone was snatched right out of my hand near {place} bus stop.",
            "Stolen backpack containing laptop and documents at {place}.",
            "Thieves took my purse while I was boarding the auto at {place}.",
            "Phone snatched from cyclist near {place} junction.",
            "Someone stole cash and credit cards from my bag while shopping at {place}.",
            "Chain snatching incident while returning from market at {place}.",
            "Thief grabbed my bag and escaped on a scooter near {place}.",
            "Pocket picked while traveling in a crowded bus near {place}.",
            "Stolen purse from the passenger seat of my car at {place} signal.",
            "Snatched ear rings from an elderly lady walking near {place}.",
            "Valuables stolen from unattended baggage near {place} railway station.",
        ]
    },
    "ASSAULT": {
        "severity": "HIGH",
        "phrases": [
            "Physically attacked and beaten by a group of unknown men near {place}.",
            "Severe physical assault after an altercation over road rage on {place}.",
            "Victim was punched and kicked repeatedly near {place} alley.",
            "Violent attack with iron rod outside the bar near {place}.",
            "Physical violence and beating reported in the parking lot of {place}.",
            "A person was assaulted with a blunt object causing head injuries near {place}.",
            "Brawl erupted and several people were attacked and injured near {place}.",
            "Group assault on a college student near {place} campus.",
            "Victim struck in the face and suffered fractures near {place}.",
            "Aggressive confrontation turned physical with serious injuries at {place}.",
            "Attacked from behind by two men while jogging near {place}.",
            "Gang assaulted a shop owner after an argument on {place}.",
        ]
    },
    "BURGLARY": {
        "severity": "MEDIUM",
        "phrases": [
            "House broken into while family was away on vacation at {place}.",
            "Locks broken and jewelry stolen from residential apartment on {place}.",
            "Burglars entered through the kitchen window and looted cash at {place}.",
            "Office premises broken into overnight and equipment stolen at {place}.",
            "Shop shutters were pried open and inventory stolen on {place}.",
            "Flat door broken open and safe emptied of gold and currency at {place}.",
            "Burglary in broad daylight while residents were out for work near {place}.",
            "Window grill cut and electronic goods taken from ground floor house at {place}.",
            "Break-in reported at a warehouse storing electronics near {place}.",
            "Commercial store looted by thieves during the weekend at {place}.",
        ]
    },
    "VANDALISM": {
        "severity": "LOW",
        "phrases": [
            "Cars parked on the street had their windshields smashed near {place}.",
            "Public property and bus stop shelter destroyed by vandals at {place}.",
            "Graffiti sprayed and building facade defaced overnight on {place}.",
            "Street lights and public benches broken intentionally near {place}.",
            "Park facilities vandalized with equipment smashed at {place}.",
            "Tires of several parked bikes slashed deliberately near {place}.",
            "Shop signs and nameplates torn down and smashed along {place}.",
            "Statue and boundary wall damaged by miscreants near {place}.",
            "Public restroom fixtures smashed and pipes broken at {place}.",
            "Garbage cans set on fire and street signs bent near {place}.",
        ]
    },
    "HARASSMENT": {
        "severity": "MEDIUM",
        "phrases": [
            "Repeatedly stalked and followed by a stranger on my way home from {place}.",
            "Verbal harassment and catcalling from men loitering near {place} bus stop.",
            "Woman followed by a biker passing inappropriate remarks near {place}.",
            "Continuous harassment and lewd comments outside women's hostel on {place}.",
            "Eve-teasing and intimidation by a group of youths standing near {place}.",
            "Stalking incident where suspect followed the victim across {place} market.",
            "Inappropriate touching and harassment in crowded subway near {place}.",
            "Threats and harassment from an unknown stalker near {place} metro station.",
            "Persistent aggressive following despite repeated warnings on {place}.",
            "Obscene gestures and verbal abuse by motorists towards pedestrians on {place}.",
        ]
    },
    "FRAUD": {
        "severity": "MEDIUM",
        "phrases": [
            "Financial fraud: scammed of 50000 rupees through fake investment scheme at {place}.",
            "Cheated by fake real estate agent who took advance payment on {place}.",
            "Card skimming fraud at ATM machine near {place}.",
            "Job scam: money taken for promise of employment near {place}.",
            "Counterfeit currency notes circulated by customer at shop in {place}.",
            "Cheque fraud and unauthorized bank withdrawal reported from {place}.",
            "Ponzi scheme victim lost lifetime savings to fraudulent company on {place}.",
            "Fake lottery ticket scam duped elderly resident near {place}.",
            "Contractor took money for construction and absconded from {place}.",
            "Loan scam with fake processing fees collected from residents near {place}.",
        ]
    },
    "CYBERCRIME": {
        "severity": "MEDIUM",
        "phrases": [
            "Phishing attack: bank account emptied after fraudulent SMS link received near {place}.",
            "Ransomware attack encrypted all business servers of company on {place}.",
            "Identity theft: unauthorized personal loans taken in my name by fraudsters from {place}.",
            "Online extortion and blackmail using compromised private photos reported from {place}.",
            "Social media account hacked and used to demand money from contacts at {place}.",
            "SIM swap fraud led to OTP theft and crypto account compromise in {place}.",
            "Customer service impersonation scam defrauded victim online at {place}.",
            "Malware injected through malicious email causing data breach at {place} firm.",
            "Online matrimonial fraud with monetary theft reported from {place}.",
            "Cryptocurrency trading scam took investment with zero withdrawals near {place}.",
        ]
    },
    "ROBBERY": {
        "severity": "CRITICAL",
        "phrases": [
            "Armed robbery at gunpoint at a jewelry store on {place}.",
            "Robbed at knifepoint in a dark alley near {place} late night.",
            "Group of men with weapons entered residence and looted all valuables at {place}.",
            "ATM security guard attacked and cash dispenser robbed near {place}.",
            "Delivery boy held at knife point and cash collected was robbed near {place}.",
            "Commercial bank branch armed robbery during business hours at {place}.",
            "Highway robbery: car intercepted by armed gang and passengers looted near {place}.",
            "Petrol pump cashier robbed at gunpoint during night shift near {place}.",
            "Valuables and vehicle taken by force using deadly weapons near {place}.",
            "Armed gang broke in and held family hostage while stealing jewelry at {place}.",
        ]
    },
    "VEHICLE_RELATED": {
        "severity": "MEDIUM",
        "phrases": [
            "Two-wheeler Honda Activa stolen from designated parking space on {place}.",
            "Car stolen from outside residential society overnight at {place}.",
            "Hit and run incident: speeding SUV knocked down pedestrian near {place} and fled.",
            "Vehicle break-in: car window smashed and stereo stolen on {place}.",
            "Motorbike stolen from office basement parking near {place}.",
            "Reckless drunk driving caused collision damaging multiple cars at {place}.",
            "Catalytic converter and car battery stolen from vehicle parked at {place}.",
            "Truck hit an auto rickshaw and driver fled the scene near {place}.",
            "Scooter stolen while parked outside shopping complex on {place}.",
            "Hit and run accident at signal junction near {place}.",
        ]
    },
    "OTHER": {
        "severity": "LOW",
        "phrases": [
            "Suspicious person loitering near school entrance for several hours on {place}.",
            "Illegal dumping of industrial hazardous chemical waste near {place} canal.",
            "Severe public nuisance and loud unauthorized party in residential area at {place}.",
            "Unattended mysterious bag found on public footpath near {place}.",
            "Dispute between neighbors regarding boundary encroachment on {place}.",
            "Stray cattle causing dangerous road obstruction near {place} flyover.",
            "Unauthorized burning of plastic waste causing heavy smoke near {place}.",
            "Missing person report: elderly man went for a walk from {place} and not returned.",
            "Minor altercation regarding parking space in apartment complex on {place}.",
            "Suspicious drone activity observed flying over private properties near {place}.",
        ]
    }
}

PLACES = [
    "FC Road", "JM Road", "MG Road", "Shivajinagar", "Kothrud", "Deccan Gymkhana",
    "Hadapsar", "Viman Nagar", "Koregaon Park", "Aundh", "Baner", "Hinjewadi",
    "Wakad", "Pimpri", "Chinchwad", "Kharadi", "Magarpatta", "Swargate", "Katraj"
]

def generate_dataset():
    data = []
    for cat, info in DATA_TEMPLATES.items():
        base_sev = info["severity"]
        for phrase in info["phrases"]:
            for place in PLACES:
                text = phrase.format(place=place)
                cleaned = clean_text(text)
                data.append({
                    "text": cleaned,
                    "category": cat,
                    "severity": base_sev
                })
    return pd.DataFrame(data)

def train_and_save():
    print("[INFO] Generating training dataset...")
    df = generate_dataset()
    print(f"[DATA] Total training samples generated: {len(df)}")
    print(df["category"].value_counts())

    # Split for validation
    X_train, X_test, y_cat_train, y_cat_test, y_sev_train, y_sev_test = train_test_split(
        df["text"], df["category"], df["severity"], test_size=0.15, random_state=42, stratify=df["category"]
    )

    print("\n[TRAIN] Training Category Classifier (TF-IDF + LogisticRegression)...")
    cat_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=12000)),
        ("clf", LogisticRegression(C=2.0, max_iter=1000, random_state=42))
    ])

    cat_pipeline.fit(X_train, y_cat_train)
    y_cat_pred = cat_pipeline.predict(X_test)
    cat_acc = accuracy_score(y_cat_test, y_cat_pred)
    print(f"[OK] Category Classification Accuracy: {cat_acc * 100:.2f}%\n")
    print(classification_report(y_cat_test, y_cat_pred))

    print("\n[TRAIN] Training Severity Estimator (TF-IDF + LogisticRegression)...")
    sev_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=10000)),
        ("clf", LogisticRegression(C=2.0, max_iter=1000, random_state=42))
    ])

    sev_pipeline.fit(X_train, y_sev_train)
    y_sev_pred = sev_pipeline.predict(X_test)
    sev_acc = accuracy_score(y_sev_test, y_sev_pred)
    print(f"[OK] Severity Estimation Accuracy: {sev_acc * 100:.2f}%\n")
    print(classification_report(y_sev_test, y_sev_pred))

    # Save models
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
    os.makedirs(models_dir, exist_ok=True)

    cat_path = os.path.join(models_dir, "classifier.joblib")
    sev_path = os.path.join(models_dir, "severity.joblib")

    joblib.dump(cat_pipeline, cat_path)
    joblib.dump(sev_pipeline, sev_path)

    print(f"[SAVE] Models successfully saved to:\n  - {cat_path}\n  - {sev_path}\n")

if __name__ == "__main__":
    train_and_save()
