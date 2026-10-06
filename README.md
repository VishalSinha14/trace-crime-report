# TRACE — Technology for Reporting, Analysis & Crime Evaluation

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?logo=postgresql&logoColor=white)](https://postgis.net/)

An AI-assisted, real-time, geospatial incident reporting and safety-intelligence platform powered by **PostGIS spatial indexing**, **machine learning NLP classification**, and a robust **three-tier Role-Based Access Control (RBAC)** architecture.

> **B.Tech CSE Final-Year Project**

---

## 🏛 Architecture Overview

```
                      React + Vite + Leaflet + Tailwind CSS
                               (Port 5173 / Frontend)
                                         ↕ REST & WebSockets
                      Node.js + Express + TypeScript API
                                (Port 5000 / Backend)
                              ↙                     ↘
          PostgreSQL 18.6 + PostGIS 3.6.2     Python FastAPI + Scikit-Learn
              (trace_db / Port 5432)                (Port 8000 / AI Service)
```

---

## 📁 Repository Structure

```
TRACE/
├── backend/            # Express + TypeScript REST API & WebSocket server
│   ├── src/            # Controllers, routes, services, middleware, sockets
│   ├── .env.example    # Backend environment variables template
│   └── package.json
├── frontend/           # React + Vite + Tailwind CSS + Leaflet frontend
│   ├── src/            # UI components, safety map, state, services
│   ├── .env.example    # Frontend environment variables template
│   └── package.json
├── ai-service/         # Python FastAPI service for NLP & severity estimation
│   ├── inference/      # ML inference predictors
│   ├── training/       # Model training scripts (TF-IDF + Calibrated Classifier)
│   ├── requirements.txt# Python dependencies
│   └── .env.example    # AI Service environment template
├── database/           # PostgreSQL schema and database seed scripts
│   ├── schema/         # SQL schema definitions (PostGIS spatial tables)
│   └── seeds/          # 10,000+ realistic Pune incidents seed data
└── data/               # Raw, processed, and synthetic data directories
```

---

## ✨ Key Features

1. **Geospatial Safety Map**:
   - Leaflet interactive map centered around the Pune metropolitan area.
   - PostGIS spatial bounding box (`ST_MakeEnvelope`), proximity search (`ST_DWithin`), and grid clustering (`ST_SnapToGrid`).
   - Dynamic severity indicators (Low, Medium, High, Critical) with custom visual markers.
   - Interactive incident reporting modal with map pin placement.

2. **AI / ML Incident Classification & Severity Pipeline**:
   - FastAPI microservice running trained TF-IDF + Calibrated Logistic Regression pipelines.
   - Automatic classification into 10 crime categories with confidence scoring.
   - Multi-factor severity estimation.

3. **Strict Role-Based Access Control (RBAC)**:
   - **Citizen**: Submit incidents, view own reports, view public verified safety map (unverified reports & reporter identities are masked/anonymized).
   - **Moderator**: Access dedicated Verification Center, inspect incoming narratives & AI scores, approve/reject/place reports under review.
   - **Admin**: Full command oversight, user role management, system telemetry, audit trail, and spatial analytics.

4. **10,000+ Geotagged Pune Incidents Database**:
   - Seeded dataset with realistic spatial hotspots (Swargate, FC Road, Hinjewadi, Pune Station Area, Baner, Kothrud, etc.).
   - PostGIS GiST spatial indexing for sub-second spatial queries across 10,000+ records.

---

## 👥 Demo Personas & Credentials

For instant testing, use the **Demo Switcher** in the web UI or log in with:

| Persona | Email | Password | Role & Permissions |
|---|---|---|---|
| **Admin** | `admin@trace.dev` | `admin123` | Full system control, analytics, RBAC, audit logs |
| **Moderator** | `moderator@trace.dev` | `mod123` | Report verification, status triage, queue review |
| **Citizen** | `citizen@trace.dev` | `citizen123` | Report submission, personal tracking, verified map |

---

## 🌐 Services & Ports

| Service | Port | Health Check |
|---|---|---|
| **Frontend Web App** | `5173` | http://localhost:5173 |
| **Backend REST & Sockets** | `5000` | http://localhost:5000/api/health |
| **AI ML Service** | `8000` | http://localhost:8000/health |
| **PostgreSQL 18 + PostGIS** | `5432` | `trace_db` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ & npm
- **Python**: v3.10+
- **PostgreSQL**: v15+ with **PostGIS** extension enabled

---

### Step 1: Database Setup & Seeding

1. Create the database:
   ```sql
   CREATE DATABASE trace_db;
   \c trace_db
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. Configure backend environment:
   ```bash
   cd backend
   cp .env.example .env
   # Update your PostgreSQL credentials in .env
   ```

3. Seed 10,000 Pune incidents and demo users:
   ```bash
   npm install
   npm run seed
   ```

---

### Step 2: AI Service Setup

```bash
cd ai-service
cp .env.example .env

# Create and activate virtual environment (optional but recommended)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt

# Train the ML classification and severity models
python training/train_classifier.py

# Start the FastAPI service
python -m uvicorn main:app --port 8000 --reload
```

---

### Step 3: Backend API Setup

```bash
cd backend
npm install
npm run dev          # Starts server on http://localhost:5000
npm run test:api     # (Optional) Runs E2E automated test suite
```

---

### Step 4: Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev          # Starts client on http://localhost:5173
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
