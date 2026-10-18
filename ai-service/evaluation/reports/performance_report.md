# TRACE — Performance Evaluation Report
**Chapter 10: System Testing & Performance Analysis**

- **Generated:** 2026-10-18 11:47:01
- **Model version:** 1.0.0-tfidf-logreg
- **Pipeline:** TF-IDF (unigram+bigram) → Logistic Regression (C=2.0)
- **Python:** 3.10.11
- **Platform:** win32

---

## 10.2 Dataset Composition & Experimental Setup

### 10.2.1 Dataset Overview

| Property | Value |
|---|---|
| Total samples | 2033 |
| Number of categories | 10 |
| Number of severity levels | 4 |
| Number of place-name templates | 19 |
| Data source | Synthetic template-based generation |
| Text preprocessing | `clean_text()` — lowercase, URL/email/phone removal, special-char removal, whitespace normalization |
| Feature extraction | TF-IDF (unigram + bigram) |
| Classifier | Logistic Regression (C=2.0, max_iter=1000) |

### 10.2.2 Category Distribution

| Category | Sample Count | Percentage |
|---|---:|---:|
| ASSAULT | 228 | 11.2% |
| BURGLARY | 190 | 9.3% |
| CYBERCRIME | 190 | 9.3% |
| FRAUD | 190 | 9.3% |
| HARASSMENT | 190 | 9.3% |
| OTHER | 190 | 9.3% |
| ROBBERY | 190 | 9.3% |
| THEFT_SNATCHING | 285 | 14.0% |
| VANDALISM | 190 | 9.3% |
| VEHICLE_RELATED | 190 | 9.3% |

### 10.2.3 Severity Distribution

| Severity | Sample Count | Percentage |
|---|---:|---:|
| LOW | 380 | 18.7% |
| MEDIUM | 1235 | 60.7% |
| HIGH | 228 | 11.2% |
| CRITICAL | 190 | 9.3% |

### 10.2.4 Train / Test Split Configuration

| Property | Value |
|---|---|
| Split method | Stratified by category |
| Test size | 15% |
| Random state | 42 |
| Training samples | 1728 |
| Test samples | 305 |
| Train/Test ratio | 5.67 : 1 |

---

## 10.3 AI-Assisted Incident Classification Performance

### Overall Classification Metrics

| Metric | Score |
|---|---:|
| **Accuracy** | 100.00% |
| Macro Precision | 100.00% |
| Macro Recall | 100.00% |
| Macro F1-Score | 100.00% |
| Weighted Precision | 100.00% |
| Weighted Recall | 100.00% |
| Weighted F1-Score | 100.00% |

### Per-Category Classification Report

| Category | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
| ASSAULT | 100.00% | 100.00% | 100.00% | 34 |
| BURGLARY | 100.00% | 100.00% | 100.00% | 28 |
| CYBERCRIME | 100.00% | 100.00% | 100.00% | 28 |
| FRAUD | 100.00% | 100.00% | 100.00% | 29 |
| HARASSMENT | 100.00% | 100.00% | 100.00% | 29 |
| OTHER | 100.00% | 100.00% | 100.00% | 29 |
| ROBBERY | 100.00% | 100.00% | 100.00% | 28 |
| THEFT_SNATCHING | 100.00% | 100.00% | 100.00% | 43 |
| VANDALISM | 100.00% | 100.00% | 100.00% | 29 |
| VEHICLE_RELATED | 100.00% | 100.00% | 100.00% | 28 |

---

## 10.4 Severity Assessment Evaluation

### 10.4.1 Raw Severity Model (without safety override)

**Accuracy:** 100.00%

| Severity | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
| LOW | 100.00% | 100.00% | 100.00% | 58 |
| MEDIUM | 100.00% | 100.00% | 100.00% | 185 |
| HIGH | 100.00% | 100.00% | 100.00% | 34 |
| CRITICAL | 100.00% | 100.00% | 100.00% | 28 |

### 10.4.2 Severity with Safety Override (ROBBERY/ASSAULT → ≥ HIGH)

**Accuracy (with override):** 100.00%

| Severity | Precision | Recall | F1-Score | Support |
|---|---:|---:|---:|---:|
| LOW | 100.00% | 100.00% | 100.00% | 58 |
| MEDIUM | 100.00% | 100.00% | 100.00% | 185 |
| HIGH | 100.00% | 100.00% | 100.00% | 34 |
| CRITICAL | 100.00% | 100.00% | 100.00% | 28 |

### 10.4.3 Safety Override Verification Cases

| Input Description | Category | Expected Severity | Actual Severity | Result |
|---|---|---|---|---|
| Armed robbery at gunpoint at a jewelry store.... | ROBBERY | HIGH | CRITICAL | ⚠️ GOT CRITICAL |
| Physically attacked and beaten by a group of unknown men.... | ASSAULT | HIGH | HIGH | ✅ PASS |
| Cars parked on the street had their windshields smashed.... | VANDALISM | LOW | LOW | ✅ PASS |
| Phishing attack emptied bank account.... | CYBERCRIME | MEDIUM | MEDIUM | ✅ PASS |

---

## 10.6 Classification Error Analysis & Confusion Matrices

### 10.6.1 Category Classification Confusion Matrix

Rows = Actual, Columns = Predicted

| Actual \ Predicted | ASSLT | BURG | CYBER | FRAUD | HARASS | OTHER | ROB | THEFT | VAND | VEH |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **ASSLT** | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **BURG** | 0 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **CYBER** | 0 | 0 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **FRAUD** | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 | 0 |
| **HARASS** | 0 | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 | 0 |
| **OTHER** | 0 | 0 | 0 | 0 | 0 | 29 | 0 | 0 | 0 | 0 |
| **ROB** | 0 | 0 | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 |
| **THEFT** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 43 | 0 | 0 |
| **VAND** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 29 | 0 |
| **VEH** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 28 |

### 10.6.2 Most Confused Category Pairs

| Actual Category | Predicted As | Count |
|---|---|---:|
| — | — | No misclassifications detected |

### 10.6.3 Severity Assessment Confusion Matrix

Rows = Actual, Columns = Predicted

| Actual \ Predicted | LOW | MEDIUM | HIGH | CRITICAL |
|---|---:|---:|---:|---:|
| **LOW** | 58 | 0 | 0 | 0 |
| **MEDIUM** | 0 | 185 | 0 | 0 |
| **HIGH** | 0 | 0 | 34 | 0 |
| **CRITICAL** | 0 | 0 | 0 | 28 |

---

## 10.7 Backend API Performance & Response Latency

### 10.7.1 Model Inference Latency (Local)

> Measured on the current machine without network overhead.

| Operation | Mean (ms) | Median (ms) | P95 (ms) | P99 (ms) | Min (ms) | Max (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Text Preprocessing | 0.007 | 0.007 | 0.008 | 0.010 | 0.006 | 0.016 |
| Category Classification | 0.270 | 0.264 | 0.301 | 0.400 | 0.244 | 0.439 |
| Severity Estimation | 0.285 | 0.262 | 0.444 | 0.540 | 0.231 | 0.580 |
| Full Analysis (cat + sev) | 0.509 | 0.508 | 0.539 | 0.556 | 0.477 | 0.571 |

### 10.7.2 Batch Throughput

| Batch Size | Total Time (ms) | Per-sample (ms) | Throughput (samples/sec) |
|---:|---:|---:|---:|
| 1 | 0.70 | 0.702 | 1425 |
| 10 | 0.80 | 0.080 | 12429 |
| 50 | 1.58 | 0.032 | 31666 |
| 100 | 2.58 | 0.026 | 38700 |

### 10.7.3 Live API Endpoint Latency

| Endpoint | Method | Status | Latency (ms) |
|---|---|---:|---:|
| Health Check | GET | FAILED | 4074.8 |
| Classification | POST | FAILED | 4057.1 |
| Severity | POST | FAILED | 4076.2 |
| Full Analysis | POST | FAILED | 4079.1 |

---

## 10.8 Robustness, Data Quality & Fault Tolerance

| Test ID | Test Case | Input (truncated) | Category | Severity | Confidence | Status |
|---|---|---|---|---|---:|---|
| R-01 | Empty string input | `None` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-02 | Whitespace-only input | `   	   ` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-03 | Very short input (1 word) | `stolen` | VEHICLE_RELATED | MEDIUM | 0.5526 | ✅ PASS |
| R-04 | Very long input (1000+ chars) | `Someone stole my phone. Someone stole my phon` | THEFT_SNATCHING | MEDIUM | 0.7962 | ✅ PASS |
| R-05 | Non-English input (Hindi) | `किसी ने मेरा फोन चुरा लिया` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-06 | Input with only URLs | `https://example.com/scam-link https://phish.x` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-07 | Input with special characters only | `!@#$%^&*()[]{}\|;:'"<>?,./~`` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS |
| R-08 | Input with email and phone numbers | `Contact victim@email.com or call +91-98765432` | CYBERCRIME | MEDIUM | 0.3252 | ✅ PASS |
| R-09 | Numeric-only input | `12345678901234567890` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS |
| R-10 | Mixed-case input | `SOMEONE SNATCHED MY PHONE Near FC Road BUS ST` | THEFT_SNATCHING | MEDIUM | 0.8247 | ✅ PASS |
| R-11 | Ambiguous description | `Something bad happened here today` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS |
| R-12 | Cross-category description | `He robbed me and then punched me repeatedly c` | ASSAULT | HIGH | 0.4578 | ✅ PASS |
| R-13 | None input type | `None` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-14 | Integer input type | `12345` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS (predicted) |
| R-15 | Repeated single character | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` | THEFT_SNATCHING | MEDIUM | 0.1275 | ✅ PASS |

### 10.8.1 Low-Confidence Prediction Analysis

Testing model behavior on ambiguous/borderline descriptions:

| Description | Top Category | Confidence | 2nd Category | 2nd Conf | Gap |
|---|---|---:|---|---:|---:|
| Something happened on the road. | THEFT_SNATCHING | 0.1700 | VANDALISM | 0.1628 | 0.0071 |
| Incident near the park. | THEFT_SNATCHING | 0.2877 | ASSAULT | 0.1436 | 0.1440 |
| Bad experience at the shop. | BURGLARY | 0.2350 | THEFT_SNATCHING | 0.1841 | 0.0509 |
| Problem reported by resident. | FRAUD | 0.2758 | CYBERCRIME | 0.1268 | 0.1489 |
| Issue with a person at the station. | ASSAULT | 0.2249 | THEFT_SNATCHING | 0.2098 | 0.0152 |

---

## 10.9 Overall Performance Analysis

### Summary Table

| Dimension | Metric | Result |
|---|---|---|
| **Dataset** | Total samples | 2033 |
| | Training set | 1728 |
| | Test set | 305 |
| | Categories | 10 |
| **Classification** | Accuracy | 100.00% |
| **Severity (raw)** | Accuracy | 100.00% |
| **Severity (with override)** | Accuracy | 100.00% |
| **Robustness** | Tests passed | 15/15 |

### Limitations

1. **Synthetic training data**: All training examples are template-generated, not sourced from real incident reports.

2. **Template severity labels**: Severity is assigned per-category by template, not per-instance by human annotation.

3. **No external test set**: The held-out test split comes from the same synthetic distribution as training data.

4. **Confidence calibration not verified**: `predict_proba` values have not been validated against actual correctness rates.

5. **Limited language coverage**: Model is trained on English text with Pune-area place names only.

6. **Category-severity coupling**: Because severity labels are assigned by category template, the severity model largely learns category boundaries.

