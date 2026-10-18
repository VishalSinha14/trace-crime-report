# TRACE — Technology for Reporting, Analysis & Crime Evaluation

TRACE is an AI-assisted, real-time, geospatial incident-reporting and
safety-awareness platform. It allows citizens to submit location-aware
incident reports, allows moderators to review them before public display, and
provides map-based exploration, notifications, auditability, and community
corroboration.

> **Project context:** B.Tech CSE final-year project  
> **Product type:** Decision-support and safety-awareness prototype  
> **Important boundary:** TRACE is not a police system, emergency-dispatch
> system, official crime database, or validated future-crime prediction
> system.

---

## 1. What TRACE does

TRACE converts a citizen's report into a controlled, reviewable workflow:

```text
Citizen report
    ↓
Request validation and authorization
    ↓
AI analysis of the incident narrative
    ↓
Transactional database persistence
    ↓
Moderator review
    ↓
Public map visibility according to status
    ↓
Community corroboration and live updates
```

The system separates:

1. **Reporting** — collecting a narrative, location, time, category, and
   optional evidence metadata.
2. **Analysis** — exploring stored incidents by category, severity, time, and
   location.
3. **Visualization** — displaying eligible incidents, clusters, and map
   intensity layers.
4. **Classification** — producing preliminary text-based category and
   severity suggestions.
5. **Moderation** — deciding whether an incident is verified, rejected,
   under review, or otherwise progressed through its lifecycle.

A report is not proof that a crime occurred. A map marker is not a legal
finding, and a model confidence value is not a guarantee of correctness.

---

## 2. End-to-end architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ React + Vite + TypeScript + Leaflet frontend                        │
│ Map, report modal, authentication, moderator queue, admin screens   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST + Socket.IO
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Node.js + Express + TypeScript backend                              │
│ Auth, RBAC, validation, incidents, moderation, analytics, audit     │
└───────────────┬──────────────────────────────┬──────────────────────┘
                │ PostgreSQL transactions       │ HTTP analysis request
                ▼                              ▼
┌─────────────────────────────┐    ┌─────────────────────────────────┐
│ PostgreSQL + PostGIS         │    │ Python FastAPI AI service        │
│ Users, incidents, geometry,  │    │ Text cleaning, TF-IDF, Logistic  │
│ analysis, audit, notifications│    │ Regression, confidence output    │
└─────────────────────────────┘    └─────────────────────────────────┘
```

### Services and ports

| Service | Technology | Default port | Health check |
|---|---|---:|---|
| Frontend | React, Vite, TypeScript, Leaflet | `5173` | `http://localhost:5173` |
| Backend | Node.js, Express, TypeScript, Socket.IO | `5000` | `http://localhost:5000/api/health` |
| AI service | Python, FastAPI, scikit-learn | `8000` | `http://localhost:8000/health` |
| Database | PostgreSQL with PostGIS | `5432` | PostgreSQL connection to `trace_db` |

The frontend communicates with the backend. The backend communicates with
PostgreSQL and calls the AI service. The browser does not connect directly to
the database or Python model.

---

## 3. Repository structure

```text
TRACE/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers and business workflows
│   │   ├── routes/            # REST endpoint definitions
│   │   ├── middleware/        # Authentication, RBAC, validation
│   │   ├── services/          # AI, audit, notification and shared services
│   │   ├── models/            # TypeScript domain types
│   │   ├── sockets/           # Socket.IO event handling
│   │   ├── index.ts           # Server bootstrap and route registration
│   │   └── seed.ts            # Demo-data generation
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Map, reporting, moderation and admin UI
│   │   ├── services/api.ts    # Typed backend API client
│   │   ├── App.tsx            # Global app state and live events
│   │   └── main.tsx           # React entry point
│   ├── .env.example
│   └── package.json
├── ai-service/
│   ├── training/
│   │   └── train_classifier.py # Synthetic data generation and model training
│   ├── inference/
│   │   └── predictor.py        # Model loading and inference
│   ├── preprocessing/
│   │   └── text_cleaner.py     # Shared input normalization
│   ├── models/                 # classifier.joblib and severity.joblib
│   ├── main.py                 # FastAPI endpoints
│   └── requirements.txt
├── database/
│   ├── schema/001_initial_schema.sql
│   ├── migrations/002_add_corroboration.sql
│   ├── seeds/seed.ts
│   ├── verify_database.sql
│   └── README.md
├── paper/
│   ├── main.tex                # Report-ready LaTeX manuscript
│   ├── README.md               # Paper compilation instructions
│   └── AUDIT.md                # Evidence and missing-artifact audit
├── corroboration_plan.md
├── safe_route_plan.md
└── research.md / latex.md      # Research-paper generation briefs
```

---

## 4. Complete incident-reporting flow

### 4.1 Citizen submits a report

The citizen selects a location on the map and opens the reporting modal. The
request normally contains:

- incident description;
- coordinates;
- occurred time;
- optional user-selected category;
- optional evidence/media metadata.

The frontend sends the request to the authenticated backend endpoint:

```text
POST /api/incidents
```

The backend validates the body and verifies that the user is authenticated.
The report should be associated with the authenticated user rather than
trusting a user identifier supplied by the browser.

### 4.2 Backend requests AI analysis

The backend sends the incident description to the Python service. The AI
service returns:

- predicted category;
- category confidence;
- alternative category predictions;
- predicted severity;
- severity confidence;
- model version.

The AI output is assistance for triage. The backend still owns persistence,
authorization, moderation, and public visibility.

### 4.3 Database transaction

The backend persists the incident and its AI analysis in a transaction. This
keeps the report and its associated analysis consistent. The database stores
both the user-provided category (when present) and the AI-predicted category.

New reports are not automatically treated as public verified incidents. They
enter the moderation workflow with public visibility controlled separately.

### 4.4 Moderator review

Moderators inspect the report, narrative, location, AI suggestion, severity,
and corroboration information in the Verification Center. The status endpoint
is:

```text
PATCH /api/incidents/:id/status
```

Possible lifecycle values defined in the schema include:

```text
SUBMITTED
UNDER_REVIEW
VERIFIED
FORWARDED
INVESTIGATING
RESOLVED
REJECTED
```

The moderator decision is recorded in the database and audit trail. The
public visibility flag is updated consistently with the moderation decision.

### 4.5 Public map behavior

The public map is filtered using the incident's lifecycle state and
`is_public` flag. A verified public incident can appear on the map. A
rejected or under-review incident should not remain publicly visible.

When visibility changes, Socket.IO events update open clients so that markers
can be added or removed without requiring a full page refresh. The database
remains authoritative; a client should refetch after reconnecting or when
live state is uncertain.

---

## 5. Artificial intelligence and machine learning

### 5.1 What model is used?

TRACE uses two separate supervised machine-learning pipelines:

```text
Category:
cleaned description → TF-IDF → Logistic Regression → category

Severity:
cleaned description → TF-IDF → Logistic Regression → severity
```

The implementation is in:

- [`ai-service/training/train_classifier.py`](ai-service/training/train_classifier.py)
- [`ai-service/inference/predictor.py`](ai-service/inference/predictor.py)
- [`ai-service/preprocessing/text_cleaner.py`](ai-service/preprocessing/text_cleaner.py)

This is not random output, generative AI, deep learning, or a neural network.
For the same model artifact and same input, inference is normally
deterministic.

### 5.2 What input does the category model use?

The category model receives the incident description as text. It does not
directly use:

- latitude or longitude as numeric features;
- user identity or credibility;
- number of corroborations;
- image or video content;
- time of day;
- historical crime counts;
- police records.

Place names can appear as ordinary words because the synthetic training
sentences contain locations. That is not the same as using geographic
coordinates or spatial risk data.

### 5.3 Text preprocessing

`clean_text()`:

1. converts text to lowercase;
2. removes URLs;
3. removes e-mail addresses;
4. removes phone numbers;
5. removes unsupported special characters;
6. normalizes repeated whitespace.

The same cleaner is used during training and inference.

### 5.4 TF-IDF features

The category vectorizer is configured as:

```python
TfidfVectorizer(
    ngram_range=(1, 2),
    min_df=2,
    max_features=12000
)
```

The severity vectorizer uses the same n-gram and minimum-document-frequency
settings but `max_features=10000`.

The effective features are:

- unigrams, such as `snatched`, `weapon`, `phishing`;
- bigrams, such as `armed robbery`, `iron rod`, `hit and run`;
- a numerical TF-IDF weight for each retained term or phrase.

`min_df=2` ignores terms appearing in fewer than two training documents.
`max_features` limits vocabulary size.

### 5.5 Logistic Regression parameters

Both classifiers use:

```python
LogisticRegression(
    C=2.0,
    max_iter=1000,
    random_state=42
)
```

`C` controls regularization, `max_iter` limits optimization iterations, and
`random_state` makes training repeatable.

For each class, Logistic Regression learns coefficients for the TF-IDF
features. In simplified form:

```text
class score =
    bias + Σ(feature value × learned feature weight)
```

The scores are converted to class probabilities. The class with the highest
probability is selected. The service also returns the top three category
alternatives.

### 5.6 Training data and labels

The current training data is generated inside
`train_classifier.py`. It is synthetic and template-based:

1. Each crime category has predefined example phrases.
2. Each phrase is expanded using a list of Pune-area place names.
3. Each generated description receives a category label.
4. Each category has a manually assigned default severity label.

Current category labels:

```text
THEFT_SNATCHING
ASSAULT
BURGLARY
VANDALISM
HARASSMENT
FRAUD
CYBERCRIME
ROBBERY
VEHICLE_RELATED
OTHER
```

Current template severity labels:

| Category | Template severity |
|---|---|
| `THEFT_SNATCHING` | `MEDIUM` |
| `ASSAULT` | `HIGH` |
| `BURGLARY` | `MEDIUM` |
| `VANDALISM` | `LOW` |
| `HARASSMENT` | `MEDIUM` |
| `FRAUD` | `MEDIUM` |
| `CYBERCRIME` | `MEDIUM` |
| `ROBBERY` | `CRITICAL` |
| `VEHICLE_RELATED` | `MEDIUM` |
| `OTHER` | `LOW` |

The data is divided using:

```python
test_size=0.15
random_state=42
stratify=df["category"]
```

This is an internal synthetic split, not an independent real-world
evaluation. No external labelled crime corpus or human annotation study is
currently documented.

### 5.7 Severity prediction and safety override

The severity model also uses TF-IDF plus Logistic Regression. It predicts
from the cleaned description using its own fitted vectorizer and coefficients.
The optional category is not included as a TF-IDF feature.

After the model prediction, a manual safety rule applies:

```python
if category in ["ROBBERY", "ASSAULT"] and top_severity in ["LOW", "MEDIUM"]:
    top_severity = "HIGH"
```

Therefore, final severity is:

```text
machine-learning severity prediction
        +
manual robbery/assault minimum-severity override
```

This override is a safety rule, not a learned or independently validated
severity model.

### 5.8 AI limitations

The current AI should be described as a prototype triage component:

- training examples are synthetic;
- labels are manually assigned by template category;
- category and severity are strongly related by construction;
- confidence values are not demonstrated to be calibrated;
- there is no independent external test set;
- the model does not establish that an incident occurred;
- the model does not predict future crime or police outcomes.

For production-quality claims, add a governed labelled dataset, annotation
guidelines, independent holdout data, class-balance analysis, calibration
tests, error analysis, and monitoring for language and geographic drift.

---

## 6. Database architecture

TRACE uses PostgreSQL with PostGIS. The canonical schema is in
[`database/schema/001_initial_schema.sql`](database/schema/001_initial_schema.sql)
and the corroboration migration is in
[`database/migrations/002_add_corroboration.sql`](database/migrations/002_add_corroboration.sql).

### Main tables

| Table | Purpose |
|---|---|
| `users` | Identity, password hash, role, active state |
| `incidents` | Narrative, category, severity, lifecycle, location, visibility |
| `incident_analysis` | AI category/severity, confidence, model version, processing time |
| `incident_media` | Optional media metadata associated with incidents |
| `corroborations` | Citizen witness, affected, or false-report statements |
| `notifications` | Status, corroboration, nearby, and system notifications |
| `audit_logs` | User/action/entity metadata, IP address, user-agent, timestamps |
| `hotspot_snapshots` | Spatial hotspot snapshot structures where enabled by schema |
| `risk_grid` | Spatial risk-grid structures where enabled by schema |

### Incident fields that control behavior

- `status` controls lifecycle state.
- `is_public` controls public visibility.
- `location` stores `GEOMETRY(Point, 4326)`.
- `latitude` and `longitude` are denormalized readable coordinates.
- `category` stores a user-provided or assigned category.
- `ai_category` and `ai_confidence` store AI output.
- `severity` stores the current severity.
- `credibility_score` stores the recalculated corroboration score.
- `occurred_at`, `created_at`, and `updated_at` support temporal behavior.

### Indexing

The schema includes:

- GiST index on incident geometry;
- indexes on status, category, severity, user, and timestamps;
- partial public-map indexes for verified public incidents;
- indexes for notifications, analysis, media, and corroborations.

PostGIS makes bounding-box, nearby, and distance-oriented queries possible.
Spatial indexing improves query access, but performance must still be measured
with realistic fixtures and record counts.

---

## 7. Moderation and corroboration

### 7.1 Moderation

Moderators can inspect incoming incidents and choose a lifecycle action such
as verification, rejection, or placing the incident under review. The
backend performs the status update transactionally, writes an audit record,
and emits live visibility changes where appropriate.

The expected consistency rule is:

```text
verified + public   → eligible for public map
rejected            → not eligible for public map
under review        → not eligible for public map
submitted           → moderation queue, normally not public
```

Resolved-incident visibility is a product policy and should be explicitly
confirmed before changing it.

### 7.2 Citizen corroboration

Authenticated citizens can submit one corroboration per incident, subject to
the database uniqueness rule and controller validation. Supported
corroboration types are:

- `WITNESSED`
- `AFFECTED`
- `FALSE_REPORT`

The flow is:

```text
Citizen opens public incident
    ↓
Selects corroboration type and writes a statement
    ↓
POST /api/incidents/:id/corroborate
    ↓
Backend validates ownership, duplicate state, and statement
    ↓
Corroboration is stored
    ↓
Credibility score is recalculated
    ↓
Reporter/moderator notifications and live updates may be emitted
```

Relevant files:

- `backend/src/controllers/corroboration.controller.ts`
- `backend/src/routes/corroboration.routes.ts`
- `frontend/src/components/CorroborateModal.tsx`
- `database/migrations/002_add_corroboration.sql`

Corroboration is a community signal, not independent proof. False reports,
coordinated manipulation, retaliation, and privacy risks require moderation
and abuse controls.

---

## 8. API groups

The backend registers these route groups:

| Prefix | Main responsibility |
|---|---|
| `/api/auth` | Register, login, current user |
| `/api/incidents` | List, retrieve, create, and moderate incidents |
| `/api/incidents/:id` | Corroboration operations |
| `/api/map` | Incidents, clusters, heatmap, nearby, safe-route |
| `/api/analytics` | Overview, hotspots, temporal patterns, AI metrics |
| `/api/notifications` | Read and update user notifications |
| `/api/admin` | Users, roles, status, audit logs, system statistics |

Representative endpoints:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/incidents
GET    /api/incidents/:id
POST   /api/incidents
PATCH  /api/incidents/:id/status

GET    /api/map/incidents
GET    /api/map/clusters
GET    /api/map/heatmap
GET    /api/map/nearby
GET    /api/map/safe-route

POST   /api/incidents/:id/corroborate
GET    /api/incidents/:id/corroborations
```

Authentication, role restrictions, request validation, rate limits, and
error handling are implemented at different backend layers. Do not bypass
the API by writing directly to production tables.

---

## 9. Frontend modules

| Component | Responsibility |
|---|---|
| `App.tsx` | Global state, authentication state, live incident events |
| `SafetyMap.tsx` | Leaflet map, markers, clusters, heatmap/hotspot layers, pins |
| `ReportModal.tsx` | Citizen incident submission and AI preview |
| `ModeratorQueue.tsx` | Moderator review, status decisions, AI/corroboration display |
| `CorroborateModal.tsx` | Citizen corroboration form |
| `AdminCenter.tsx` | User administration, audit and analytics views |
| `MyReports.tsx` | Citizen's submitted incident tracking |
| `SafeRoutePanel.tsx` | Safe-route interaction surface |
| `services/api.ts` | Typed API requests and response models |

The map uses Leaflet tiles with OpenStreetMap attribution. OpenStreetMap
tiles/map data should not be interpreted as proof that TRACE contains a
validated road-disruption or road-vulnerability model. The safe-route
feature requires separate validation against road and travel-impact data.

---

## 10. Setup and running locally

### Prerequisites

- Node.js 18 or later
- npm
- Python 3.10 or later
- PostgreSQL with PostGIS
- A PostgreSQL client such as `psql`

### 10.1 Database

Create the database and enable extensions:

```sql
CREATE DATABASE trace_db;
\c trace_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Apply the schema from the repository root:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres -d trace_db `
  -f "database\schema\001_initial_schema.sql"
```

For an existing database, apply the corroboration migration after the
initial schema:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres -d trace_db `
  -f "database\migrations\002_add_corroboration.sql"
```

Configure `backend/.env` from `backend/.env.example`. Do not commit real
passwords, JWT secrets, or API credentials.

### 10.2 AI service

```powershell
Set-Location ai-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py training\train_classifier.py
py -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The training command regenerates and saves:

```text
ai-service/models/classifier.joblib
ai-service/models/severity.joblib
```

Start the service before starting the backend if you want live AI analysis.
Check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

### 10.3 Backend

```powershell
Set-Location backend
npm install
npm run build
npm run dev
```

Check:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

The backend API depends on PostgreSQL and normally calls the AI service for
incident analysis.

### 10.4 Frontend

```powershell
Set-Location frontend
npm install
npm run build
npm run dev
```

Open:

```text
http://localhost:5173
```

Use `frontend/.env.example` to configure the backend URL if the frontend
does not use its default.

---

## 11. Demo users and safe testing

The seed/demo setup provides role-specific accounts when the seed script has
been run. Treat the following values as development-only credentials:

| Role | Example email | Example password |
|---|---|---|
| Admin | `admin@trace.dev` | `admin123` |
| Moderator | `moderator@trace.dev` | `mod123` |
| Citizen | `citizen@trace.dev` | `citizen123` |

Change or remove demo credentials before any shared or deployed environment.

### Recommended manual test

1. Start PostgreSQL, AI service, backend, and frontend.
2. Log in as a citizen.
3. Click a map location and submit a report with a clear narrative.
4. Confirm the report is stored and appears in the moderator queue.
5. Log in as a moderator in another session.
6. Verify the report and confirm that `status` and `is_public` change in the
   database.
7. Check that the public map receives the live update.
8. Reject or place another report under review and confirm that it is removed
   from the public map.
9. Log in as a different citizen and submit a corroboration.
10. Confirm the corroboration, credibility score, notification, and audit
    behavior.

### Database verification

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres -d trace_db `
  -f "database\verify_database.sql"
```

### Existing automated checks

```powershell
Set-Location backend
npm run build
npm run test:api
```

The frontend currently has a build script but no dedicated automated `test`
script in its package manifest. Add a real frontend test suite before
presenting frontend test coverage as complete.

---

## 12. What is implemented, partial, planned, and unknown?

### Implemented in the repository

- React map-first frontend.
- Incident reporting and personal report tracking.
- Express/TypeScript backend.
- PostgreSQL/PostGIS schema and spatial indexes.
- Authentication and three roles.
- Incident lifecycle and moderator status updates.
- Public visibility filtering.
- AI category and severity inference.
- Notifications and audit logging.
- Socket.IO live visibility updates.
- Citizen corroboration workflow.
- Admin user and audit interfaces.
- Map incident, cluster, heatmap, and nearby query surfaces.

### Implemented but prototype-level

- Synthetic TF-IDF/Logistic Regression models.
- Template-generated training data.
- AI confidence values without demonstrated calibration.
- Seed/demo incident data.
- Safe-route interaction and backend surface without validated operational
  road-risk evidence.

### Planned or requiring deeper validation

- Independent real-world labelled data for category and severity.
- Human annotation protocol and inter-annotator agreement.
- Model calibration and external holdout evaluation.
- Load, latency, throughput, and reliability benchmarks.
- Formal usability and accessibility studies.
- Security testing and threat-model validation.
- Fairness and language/geographic drift analysis.
- Validated road-risk scoring using road-disruption or travel-impact labels.
- Production deployment, monitoring, backup, retention, and incident response.

### Not supported by this repository

The repository does not contain evidence for the following unrelated
rainfall/road-network research claims:

- ERA5 rainfall dataset and weather-lag pipeline;
- 30-model Random Forest ensemble;
- 16-block spatial cross-validation;
- +30-minute or +60-minute rainfall forecasting;
- typhoon stress testing;
- approximately 3.9 million meteorological samples;
- approximately 153,000 validated road segments;
- validated road closure or flood-disruption prediction.

These claims must not be added to a TRACE report unless the corresponding
data, code, experiment logs, and validation artifacts are actually added.

---

## 13. Report/presentation explanation

### One-minute explanation

TRACE is a map-based incident-reporting system. A citizen reports an incident
with a description and location. The backend validates and stores it, while
a separate Python service uses TF-IDF and Logistic Regression to provide a
preliminary category and severity suggestion. The report initially waits for
moderator review. Once a moderator verifies it, it can become visible on the
public map. Other citizens can corroborate the incident, updating a
credibility signal. PostgreSQL/PostGIS stores the records and locations,
while Socket.IO keeps open map and moderator screens synchronized.

### Technical explanation

TRACE is a three-tier application with a React/Vite client, an
Express/TypeScript service layer, and PostgreSQL/PostGIS persistence. The
backend also integrates a Python FastAPI inference service. Incident
creation, AI analysis, incident persistence, moderation status, public
visibility, audit records, notifications, and corroboration are separate
concerns connected through typed routes and transactional database logic.
Spatial queries use PostGIS geometry and indexes. AI results are stored as
versioned analysis records, but the current model is trained on synthetic
templates and must be treated as a prototype.

### Main differentiator

The strongest distinctive feature is the combination of:

```text
AI-assisted triage
    + moderator-controlled publication
    + community corroboration
    + spatial map exploration
    + auditable status changes
```

The differentiator is explainability and workflow traceability, not a claim
that the model can determine whether a crime occurred or predict crime with
operational certainty.

---

## 14. Research and report artifacts

The `paper/` directory contains a report-ready LaTeX manuscript:

- [`paper/main.tex`](paper/main.tex)
- [`paper/README.md`](paper/README.md)
- [`paper/AUDIT.md`](paper/AUDIT.md)

Compile from the `paper` directory:

```powershell
pdflatex main.tex
pdflatex main.tex
```

The manuscript explicitly separates verified implementation facts from
planned evaluation and missing evidence. Before academic submission:

1. replace author and affiliation placeholders;
2. run and preserve functional and database test outputs;
3. create an independent labelled AI evaluation set;
4. measure map/API performance;
5. conduct privacy, security, usability, accessibility, and fairness review;
6. verify every cited source and final implementation statement.

---

## 15. Responsible-use and limitations statement

TRACE displays reported incidents, not all crime. Reports can be incomplete,
incorrect, duplicated, biased by access and trust, or malicious. Spatial
concentration can reflect reporting and enforcement patterns. AI labels can
be wrong, especially for language or situations unlike the synthetic
training templates. Users must not treat a marker, heatmap, confidence
value, credibility score, or safe-route result as guaranteed truth.

Any deployment involving sensitive personal information, precise locations,
or consequential decisions requires a formal privacy, security, legal, and
ethics review. Human oversight, correction, deletion, access control, audit
logs, and clear public communication are required.

---

## 16. License

This project is licensed under the MIT License. See
[`LICENSE`](LICENSE).
