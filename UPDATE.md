# TRACE — Project Status & Progress Update (`UPDATE.md`)

**Project Name:** TRACE (Technology for Reporting, Analysis & Crime Evaluation)  
**Project Type:** B.Tech CSE Final-Year Project  
**Tech Stack:** PostgreSQL 18 + PostGIS 3.6 | Node.js + Express + TypeScript | Python FastAPI + Scikit-learn ML | React + Vite + Leaflet + Tailwind CSS  
**Target Location:** Pune Metropolitan Area, Maharashtra, India  

---

## 1. Executive Summary

TRACE is a modern, AI-assisted, real-time geospatial crime/incident reporting and safety-intelligence platform. It bridges citizen reporting with automated AI triage and administrative oversight. 

As of this update, **the core multi-tier architecture is fully operational and integrated**, featuring a PostGIS spatial database seeded with 10,000+ geotagged Pune incident records, a Python FastAPI NLP microservice, a Node.js/TypeScript REST & WebSocket API, and an interactive React web dashboard supporting 3-tier Role-Based Access Control (RBAC).

---

## 2. Completed Work & Key Achievements

### 🗄️ 1. Database & Geospatial Infrastructure
- **PostgreSQL + PostGIS Integration:** Installed and configured PostgreSQL 18 with PostGIS 3.6 extension (`GEOMETRY(Point, 4326)`).
- **Synthetic Pune Dataset:** Created and executed a robust seeding script generating **10,000+ realistic geotagged incidents** across major Pune urban hubs (FC Road, Swargate, Hinjewadi, Pune Station, Kothrud, Baner, Viman Nagar, etc.).
- **Spatial Indexing & Optimization:** Applied Spatial GiST indexes (`idx_incidents_location_gist`) and spatial functions (`ST_MakeEnvelope`, `ST_DWithin`, `ST_SnapToGrid`) for sub-second spatial queries.
- **Relational Schema:** Designed tables for `users`, `incidents`, `evidence_files`, `verifications`, `audit_logs`, and `notifications`.

### 🧠 2. AI / ML Microservice (FastAPI + Scikit-Learn)
- **NLP Category Classifier:** Trained a TF-IDF vectorizer + Calibrated Logistic Regression model on incident narratives, achieving multi-class classification across 10 crime categories.
- **Multi-Factor Severity Engine:** Built a hybrid model combining narrative text sentiment/keyword weightings with category defaults to compute dynamic severity scores (Low, Medium, High, Critical).
- **Unified FastAPI REST Endpoints:**
  - `POST /predict/classification`: Predicts category and confidence score with fallback alternatives.
  - `POST /predict/severity`: Computes incident severity level and confidence.
  - `POST /predict/analyze`: Combined classification and severity evaluation pipeline.

### 🔌 3. Node.js & TypeScript Backend API
- **Modular REST API:** Built Express server with TypeScript, fully typed data transfer objects (DTOs), and controllers.
- **Strict Backend RBAC Authorization:** Implemented JWT authentication and middleware (`authenticateJWT`, `requireRole`) strictly enforcing permissions for `CITIZEN`, `MODERATOR`, and `ADMIN`.
- **Real-Time WebSockets (Socket.IO):** Broadcasts real-time events (`INCIDENT_NEW`, `INCIDENT_VERIFIED`, `INCIDENT_STATUS_CHANGE`) to connected frontend clients.
- **API Health & Test Suite:** Built automated end-to-end API test script (`npm run test:api`) covering authentication, report creation, map queries, moderation approval, and admin analytics.

### 🎨 4. Frontend Web Dashboard (React + Leaflet + Tailwind CSS)
- **Interactive Safety Map:** Leaflet map rendered with dark/light visual overlays, custom category/severity pin markers, popup incident cards, and category/severity filtering.
- **Pin Placement Modal:** Interactive map modal allowing citizens to drop pins directly on coordinates or auto-detect browser GPS.
- **3-Tier Role Switcher & Views:**
  - **Citizen View:** Map view of verified public-safe incidents, incident submission modal, and "My Reports" tracking tab.
  - **Moderator Queue:** Dedicated triage center showing pending AI-classified reports, confidence metrics, narrative inspection, and verification actions (Approve, Reject, Put Under Review).
  - **Admin Command Center:** System-wide metrics (total, pending, verified, investigating, resolved), complete incident map, user management, and system logs.

### 🛡️ 5. Pipeline Hardening & Edge-Case Fixes
- **Atomic DB Transactions:** Wrapped `createIncident` multi-table operations (`incidents` + `incident_analysis`) in PostgreSQL client transactions (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Eliminated Unverified Optimistic Map Leak:** Enforced strict status checking in `App.tsx` so unverified `SUBMITTED` reports are not prepended to the public map before moderation.
- **Bi-Directional Socket Map Synchronization:** Added `incident:updated` listener in `App.tsx` so rejected or non-public incidents are immediately removed from client maps in real-time.
- **Live Moderator Triage:** Connected `ModeratorQueue.tsx` directly to Socket.IO (`incident:new` / `incident:updated`) for real-time incoming report triage without manual page refresh.

### 🔐 6. Full-Page Auth Gate & Security Hardening
- **Modern Full-Page Auth Architecture:**
  - `LandingPage.tsx`: Interactive public landing page with feature breakdown, live stats showcase, role-specific feature guides, and call-to-actions.
  - `LoginPage.tsx`: Sleek split-panel login page with quick-access persona selectors for testing (Citizen, Moderator, Admin) and password visibility toggling.
  - `RegisterPage.tsx`: Dedicated user registration with real-time password strength indicators (length, numbers, uppercase).
- **Authentication & Cryptographic Hardening:**
  - **Bcrypt Hashing (Cost Factor 12):** Migrated all passwords from insecure legacy hashing to standard bcrypt.
  - **JWT Startup Safeguards:** Server halts immediately if `JWT_SECRET` is unset or still uses default fallback strings in production.
  - **DDoS & Brute-Force Rate Limiting:** Installed `express-rate-limit` protecting `/api/auth/login` and `/api/auth/register` (max 10 attempts/15m) and POST `/api/incidents` (max 20 submissions/hour).
  - **Citizen Verification Notifications:** Added real-time socket updates (`incident:my_update`) in `MyReports.tsx` with instant visual toast notifications upon approval or rejection.
  - **Location Pin Warning:** Integrated pin coordinate check warning in `ReportModal.tsx` to prevent accidental submissions with default coordinates.
  - **Database Reseeding:** Re-seeded all 10,000 incidents and demo user accounts (`admin@trace.dev`, `moderator@trace.dev`, `citizen@trace.dev`) with bcrypt hashes.

---

## 3. Working Components Overview

| Component | Technology | Primary Function | Operational Status |
|---|---|---|---|
| **Database** | PostgreSQL 18.6 + PostGIS 3.6.2 | Spatial indexing, incident store, user accounts, audit logging | ✅ Active (`trace_db` on port 5432) |
| **Backend API** | Node.js + Express + TypeScript | Authentication, RBAC, PostGIS queries, WebSocket hub | ✅ Active (Port 5000) |
| **AI Microservice** | Python FastAPI + Scikit-Learn | NLP narrative classification & severity prediction | ✅ Active (Port 8000) |
| **Frontend Web App** | React 18 + Vite + Leaflet | Map visualization, incident reporting, triage & admin UI | ✅ Active (Port 5173) |
| **Real-Time Sockets** | Socket.IO | Live updates for new incidents & moderation changes | ✅ Active |

---

## 4. Current System Functionality & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                  USER / CITIZEN                                   |
|   1. Submits report narrative & drops location pin on interactive Leaflet map    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                TRACE BACKEND API                                  |
|   2. Receives POST /api/incidents                                                |
|   3. Calls Python AI Microservice (POST http://localhost:8000/predict/analyze)    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                               PYTHON AI MICROSERVICE                              |
|   4. TF-IDF + Logistic Regression analyzes narrative                              |
|   5. Returns predicted category (e.g. THEFT_SNATCHING 92%) & severity (HIGH)      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             POSTGRESQL + POSTGIS DB                               |
|   6. Stores report with ST_SetSRID(ST_MakePoint(lng, lat), 4326)                  |
|   7. Status initialized as 'PENDING', is_public = false                           |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                MODERATOR QUEUE                                    |
|   8. Moderator inspects report & AI confidence in Moderator Queue                 |
|   9. Moderator clicks 'Approve & Verify' -> Updates status='VERIFIED', is_public=true|
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             PUBLIC SAFETY MAP & SOCKETS                           |
|  10. Socket.IO emits INCIDENT_VERIFIED event                                      |
|  11. Public map queries GET /api/map (WHERE status='VERIFIED' AND is_public=true) |
|  12. Pin appears instantly on citizen map with anonymized reporter details         |
+-----------------------------------------+-----------------------------------------+
```

### Security & Privacy Rules Enforced
1. **Public Anonymization:** Unverified reports and reporter personal details are masked on citizen endpoints.
2. **Backend Enforcement:** API routes (`/api/admin/*`, `/api/incidents/verify`) validate JWT claims and throw `401/403` if unauthorized.
3. **Spatial Boundaries:** Spatial queries return bounding-box sanitized results for fast map rendering.

---

## 5. Next Steps & Recommendations for Improvement

To take TRACE from a final-year working prototype to an enterprise-grade platform, the following enhancements are recommended:

### 🎯 1. Multimodal AI Integration (Audio & Image)
- **Audio Classification Model:** Integrate an audio CNN model (e.g., YAMNet / custom ResNet) to process emergency voice recordings or distress sounds (screams, glass break, gunshots).
- **Computer Vision Evidence Analysis:** Add automatic image evidence screening using lightweight vision models (e.g., YOLO or ResNet) to check uploaded evidence photos for weapons or damage.

### 🗺️ 2. Advanced Spatial Analytics & Hotspot Forecasting
- **Kernel Density Estimation (KDE) Heatmaps:** Render true spatial heatmaps on Leaflet using PostGIS spatial density calculations.
- **Spatio-Temporal Trend Forecasting:** Implement time-series analysis (ARIMA / Prophet or LSTM) to predict high-risk time windows for specific urban zones in Pune.

### 📱 3. Mobile Responsiveness & Emergency Alerts
- **Progressive Web App (PWA) / Mobile UI:** Optimize the Leaflet UI for mobile screens with one-tap emergency reporting.
- **Geofenced Push Notifications:** Trigger Web Push / SMS alerts to citizens when entering high-severity incident zones (via PostGIS proximity check).

### 🐳 4. Deployment, Containerization & CI/CD
- **Docker Compose Setup:** Create a unified `docker-compose.yml` orchestrating PostgreSQL/PostGIS, Node.js API, Python AI Service, and Nginx frontend.
- **Automated CI/CD Pipeline:** Set up GitHub Actions for automated linting, building, and running E2E API tests (`test_api.ts`).

---

*Document updated on: October 02, 2026*  
*TRACE B.Tech CSE Final-Year Development Team*
