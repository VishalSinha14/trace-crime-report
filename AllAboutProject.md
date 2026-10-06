# TRACE --- All About Project

## Technology for Reporting, Analysis & Crime Evaluation

**Project type:** B.Tech CSE Final-Year Project\
**Core idea:** AI-assisted, real-time, geospatial crime/incident
reporting and safety-intelligence platform.

------------------------------------------------------------------------

# 1. Project Summary

TRACE is a **map-first web platform** that converts citizen incident
reports into structured, location-aware safety information.

The complete flow is:

**Report → Validate → AI Analyze → Store → Map → Analyze Patterns →
Inform**

A user can submit an incident using a description, category, time,
location and optional evidence. The backend validates and stores the
report. AI analyzes the free-text description to suggest an incident
category and preliminary severity/priority. The geospatial layer
associates the report with coordinates and geographic areas. The
frontend then presents appropriate incidents, trends and hotspot
information through an interactive map and dashboards.

TRACE has two major user-facing experiences:

1.  **Citizen side**
    -   View the interactive map
    -   Search locations
    -   Filter incidents
    -   Submit reports
    -   Track submitted reports
    -   View privacy-aware local safety information
    -   Receive relevant notifications
2.  **Authorized/Admin side**
    -   Review reports
    -   Verify/moderate reports
    -   Change report status
    -   View analytics
    -   Inspect crime-category trends
    -   View spatial concentration/hotspots
    -   Monitor temporal patterns
    -   Manage users and system data

TRACE is a **decision-support and safety-awareness prototype**, not a
replacement for emergency services, FIR registration, police systems or
official law-enforcement procedures.

AI predictions are signals for assistance and triage; they are not proof
that a crime occurred.

------------------------------------------------------------------------

# 2. What We Are Actually Building

The final prototype should contain these major modules:

``` text
TRACE
│
├── 1. Landing / Authentication
│
├── 2. Citizen Application
│   ├── Interactive Map
│   ├── Report Incident
│   ├── My Reports
│   ├── Report Details
│   ├── Safety Alerts
│   └── Profile
│
├── 3. AI Analysis
│   ├── Incident Classification
│   ├── Confidence Score
│   ├── Severity / Priority Estimation
│   └── Text Processing
│
├── 4. Geospatial Intelligence
│   ├── Incident Markers
│   ├── Marker Clustering
│   ├── Heatmap
│   ├── Geographic Aggregation
│   └── Hotspot Detection
│
├── 5. Analytics
│   ├── Crime Trends
│   ├── Category Distribution
│   ├── Time Analysis
│   ├── Geographic Concentration
│   └── Hotspot Analysis
│
├── 6. Admin Dashboard
│   ├── Report Review
│   ├── Verification / Moderation
│   ├── Status Management
│   ├── Analytics
│   └── User Management
│
└── 7. Real-Time Layer
    ├── New Report Updates
    ├── Status Updates
    └── Notifications
```

------------------------------------------------------------------------

# 3. Recommended Technology Stack

The stack should remain relatively simple and modular so that Code
Assist can build and debug it efficiently.

## Frontend

-   **React.js**
-   **Vite**
-   **TypeScript**
-   **Tailwind CSS**
-   **React Router**
-   **TanStack Query / React Query** for server-state and API caching
-   **Leaflet**
-   **React-Leaflet**
-   Leaflet marker clustering
-   Leaflet heatmap or canvas-based visualization
-   **Recharts** or another lightweight charting library
-   Axios or native `fetch`

### Why React + Vite

The application has several highly interactive screens, especially the
map, filters and dashboard. React provides component-based UI while Vite
keeps development fast.

------------------------------------------------------------------------

# 4. Backend

Recommended:

-   **Node.js**
-   **Express.js**
-   **TypeScript**
-   REST API
-   **Socket.IO** for real-time events
-   JWT-based authentication
-   Role-based authorization

The backend is responsible for:

-   Authentication
-   Authorization
-   Input validation
-   Report creation
-   Report retrieval
-   Map queries
-   Filtering
-   AI-service communication
-   Analytics APIs
-   Admin operations
-   Notification events
-   Rate limiting
-   Audit logging

------------------------------------------------------------------------

# 5. Database

Use:

## PostgreSQL + PostGIS

This should be the primary database.

PostgreSQL handles normal relational data while PostGIS handles:

-   Latitude/longitude
-   Geographic points
-   Bounding-box queries
-   Distance queries
-   Spatial filtering
-   Geographic aggregation
-   Spatial indexes

This is preferable to treating latitude and longitude as ordinary
numeric fields because TRACE is fundamentally a geospatial application.

------------------------------------------------------------------------

# 6. Core Database Tables

A practical initial schema:

### users

``` text
id
name
email
password_hash
role
created_at
updated_at
```

Roles:

``` text
CITIZEN
MODERATOR
ADMIN
```

### incidents

``` text
id
user_id
description
category
ai_category
ai_confidence
severity
status
location
latitude
longitude
location_area
occurred_at
created_at
updated_at
is_public
```

`location` should be a PostGIS `POINT` field.

Possible statuses:

``` text
SUBMITTED
UNDER_REVIEW
VERIFIED
FORWARDED
INVESTIGATING
RESOLVED
REJECTED
```

### incident_media

``` text
id
incident_id
file_url
file_type
file_size
created_at
```

Store media in object/cloud storage rather than directly inside
PostgreSQL.

### incident_analysis

``` text
id
incident_id
predicted_category
category_confidence
predicted_severity
severity_confidence
model_version
created_at
```

### notifications

``` text
id
user_id
incident_id
type
title
message
read
created_at
```

### audit_logs

``` text
id
user_id
action
entity_type
entity_id
metadata
created_at
```

### Optional: hotspot_snapshots

``` text
id
grid_id
geometry
risk_score
incident_count
time_window
category
generated_at
```

This can store precomputed hotspot results instead of calculating
expensive spatial analysis every time the map loads.

------------------------------------------------------------------------

# 7. AI / ML Layer

The AI layer should initially solve three problems.

## A. Incident Classification

Input:

``` text
"Someone snatched my phone near the bus stop."
```

Output:

``` json
{
  "category": "THEFT_SNATCHING",
  "confidence": 0.94
}
```

Initial categories can include:

``` text
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

The exact category list should be configurable rather than hard-coded
throughout the application.

------------------------------------------------------------------------

# 8. AI Model Strategy

Do not start with a complicated transformer pipeline.

Build the first working version using:

-   Text cleaning
-   TF-IDF
-   Logistic Regression / Linear SVM
-   Scikit-learn
-   Confidence/probability output where appropriate

Possible future upgrade:

``` text
TF-IDF + Logistic Regression
        ↓
Transformer / BERT-style classifier
        ↓
Multilingual model
```

The first model should be lightweight, explainable and easy to deploy.

------------------------------------------------------------------------

# 9. Severity / Priority Analysis

The system can estimate preliminary severity using a separate model or a
controlled rule/ML layer.

Example output:

``` text
LOW
MEDIUM
HIGH
CRITICAL
```

Possible input features:

-   Incident category
-   Description text
-   Presence of violence-related terms
-   Injury indication
-   Weapon indication
-   Threat indication
-   Time
-   Location context
-   Historical incident density

Important:

Severity is a **preliminary AI-assisted priority signal**, not a legal
determination.

The UI should clearly show that it is an AI-generated estimate.

------------------------------------------------------------------------

# 10. Hotspot / Risk Analysis

The analytics engine should use:

-   Incident coordinates
-   Incident category
-   Timestamp
-   Historical frequency
-   Geographic density
-   Time-of-day patterns
-   Day-of-week patterns

Possible algorithms:

### Initial implementation

-   Grid-based geographic aggregation
-   Kernel Density / density estimation
-   DBSCAN for spatial clustering

### Later enhancement

-   Spatial-temporal clustering
-   Time-windowed risk scores
-   Predictive models

Do not begin with complex forecasting.

First make the historical hotspot system reliable and fast.

------------------------------------------------------------------------

# 11. Dataset Strategy

The project should use a combination of:

## A. Public / Open Crime Dataset

Use an openly available historical crime/incident dataset for:

-   Model training
-   Analytics
-   Hotspot visualization
-   Trend analysis

The dataset must be normalized into the TRACE schema.

Expected useful fields:

``` text
incident_id
date
time
latitude
longitude
category
description   (if available)
location
status        (if available)
```

Not every public dataset will contain all fields.

------------------------------------------------------------------------

## B. Synthetic TRACE Dataset

A synthetic dataset is strongly recommended for the prototype.

Generate realistic records containing:

-   Incident descriptions
-   Categories
-   Coordinates
-   Dates
-   Times
-   Severity
-   Status
-   AI labels
-   Verification status

This allows us to demonstrate:

-   Real-time reporting
-   Map interaction
-   Hotspots
-   Filters
-   Admin workflows
-   AI processing

without requiring access to private police data.

------------------------------------------------------------------------

## C. Live Demo Data

During development, allow the backend to create new reports from the
application itself.

This gives us:

``` text
Existing historical data
        +
New citizen reports
        ↓
Database
        ↓
AI analysis
        ↓
Map / analytics
```

------------------------------------------------------------------------

# 12. Important Map Requirement

The map is one of the most important components of TRACE.

It must feel **smooth and interactive**, even when the database contains
many incidents.

Do NOT load every incident into the browser at once.

Bad architecture:

``` text
Database
   ↓
Fetch 100,000 incidents
   ↓
Browser
   ↓
Render 100,000 markers
```

This will cause lag.

------------------------------------------------------------------------

# 13. High-Performance Map Architecture

Use:

``` text
User moves/zooms map
        ↓
Get current map bounds
        ↓
Backend receives bounding box
        ↓
PostGIS spatial query
        ↓
Return only incidents visible in viewport
        ↓
Frontend renders visible data
```

The API should support a bounding box:

``` text
GET /api/incidents?bbox=minLng,minLat,maxLng,maxLat
```

The backend should query PostGIS using spatial indexes.

------------------------------------------------------------------------

# 14. Map Performance Rules

These rules are mandatory.

### Rule 1 --- Never render all markers

Only render incidents currently needed by the viewport.

### Rule 2 --- Marker clustering

When zoomed out:

``` text
500 incidents
     ↓
Cluster
     ↓
12 visible clusters
```

When zooming in, clusters split into individual incidents.

### Rule 3 --- Use spatial indexes

Create a PostGIS spatial index on the incident geometry.

### Rule 4 --- Limit API results

Every map query should have a maximum response size.

### Rule 5 --- Debounce map movement

Do not call the API for every pixel of movement.

Wait briefly after:

-   pan
-   zoom
-   filter changes

then request data.

### Rule 6 --- Cancel outdated requests

If the user moves the map again before the previous request finishes,
cancel/ignore the older request.

### Rule 7 --- Cache map queries

Use React Query caching where useful.

### Rule 8 --- Separate markers and heatmaps

Do not render thousands of individual markers while simultaneously doing
heavy heatmap calculations on the client.

### Rule 9 --- Use Canvas where appropriate

For high-density visualizations, prefer canvas rendering over thousands
of DOM/SVG elements.

### Rule 10 --- Aggregate when zoomed out

At low zoom levels, return:

``` text
grid cell
incident count
risk score
```

instead of individual incidents.

------------------------------------------------------------------------

# 15. Multi-Level Map Rendering

Use different representations depending on zoom.

``` text
ZOOMED OUT
    ↓
Aggregated grid / density
    ↓
Clusters
    ↓
Individual markers
    ↓
Detailed incident view
ZOOMED IN
```

Example:

``` text
Zoom 8  → City-level density
Zoom 10 → Area/grid aggregation
Zoom 12 → Marker clusters
Zoom 14+ → Individual incident markers
```

The exact zoom thresholds can be tuned during development.

This is one of the most important design decisions for smooth map
interaction.

------------------------------------------------------------------------

# 16. Map Features

The main TRACE map should contain:

### Search

``` text
Search location...
```

### Category filter

``` text
All
Theft / Snatching
Assault
Burglary
Vandalism
Harassment
Fraud
Cybercrime
Other
```

### Time filter

``` text
Today
Last 7 Days
Last 30 Days
Last 3 Months
Custom
```

### Status filter

For authorized users:

``` text
All
Submitted
Under Review
Verified
Investigating
Resolved
Rejected
```

### Visualization mode

``` text
Markers
Clusters
Heatmap
Hotspots
```

### Map controls

``` text
+
-
Locate Me
Reset View
Layers
```

------------------------------------------------------------------------

# 17. Incident Marker Behaviour

Clicking a marker should open a compact card:

``` text
THEFT / SNATCHING

Area: FC Road
Time: 18:24
Severity: Medium
Status: Verified

[View Details]
```

Do not display sensitive personal information.

Unverified reports should not be presented publicly as established
facts.

------------------------------------------------------------------------

# 18. Frontend Pages

## Public / Citizen

### `/`

Landing page

Contains:

-   TRACE branding
-   Project explanation
-   Map preview
-   Login/Register
-   Report Incident CTA

### `/map`

Main interactive map.

### `/report`

Report form.

Fields:

``` text
Description
Category (optional)
Location
Date/time
Optional media
```

If the category is omitted, AI should suggest one.

### `/reports`

User's submitted reports.

### `/reports/:id`

Detailed report and status timeline.

### `/alerts`

Safety notifications.

### `/profile`

User profile/settings.

------------------------------------------------------------------------

# 19. Admin Pages

### `/admin`

Dashboard overview.

Show:

``` text
Total Reports
Pending Review
Verified Reports
Reports Today
High/Critical Reports
```

### `/admin/reports`

Report-management table.

Features:

-   Search
-   Filters
-   Review
-   Verify
-   Reject
-   Change status

### `/admin/map`

Full intelligence map.

### `/admin/analytics`

Charts for:

-   Crime category
-   Time trends
-   Geographic concentration
-   Severity
-   Status
-   Hotspots

### `/admin/users`

User and role management.

------------------------------------------------------------------------

# 20. Backend API Structure

Recommended API groups:

``` text
/api/auth
/api/users
/api/incidents
/api/map
/api/analytics
/api/hotspots
/api/notifications
/api/admin
/api/ai
```

Example endpoints:

``` text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/incidents
GET    /api/incidents/:id
GET    /api/incidents
PATCH  /api/incidents/:id

GET    /api/map/incidents
GET    /api/map/clusters
GET    /api/map/heatmap

GET    /api/analytics/summary
GET    /api/analytics/trends
GET    /api/analytics/categories
GET    /api/analytics/hotspots

POST   /api/ai/classify
POST   /api/ai/severity

GET    /api/notifications
PATCH  /api/notifications/:id/read
```

Admin endpoints must be protected by role-based authorization.

------------------------------------------------------------------------

# 21. Report Submission Workflow

When a citizen submits:

``` text
Frontend
   ↓
Validate form
   ↓
POST /api/incidents
   ↓
Backend validation
   ↓
Coordinate validation
   ↓
Store initial report
   ↓
AI classification
   ↓
Severity estimation
   ↓
Spatial indexing
   ↓
Report status = SUBMITTED
   ↓
Admin/moderator review
   ↓
Verification/status update
   ↓
Socket.IO event
   ↓
Map/dashboard update
```

AI processing should not make the UI feel frozen.

Use asynchronous processing where practical.

------------------------------------------------------------------------

# 22. Real-Time Architecture

Use:

**Socket.IO**

When an important event occurs:

``` text
New verified report
        ↓
Backend
        ↓
Socket.IO
        ↓
Connected dashboards/maps
```

Example event:

``` text
incident:created
incident:updated
incident:verified
incident:resolved
notification:new
```

Do not broadcast every database change to every user.

Use rooms/channels where useful:

``` text
public-map
admin-dashboard
user-{id}
```

Only send information that the connected user is authorized to see.

------------------------------------------------------------------------

# 23. AI Service Architecture

Keep the AI code separate from the Node backend.

Recommended:

``` text
TRACE/
├── frontend/
├── backend/
└── ai-service/
```

AI service:

-   Python
-   FastAPI
-   scikit-learn
-   pandas
-   joblib
-   NLP preprocessing

Example:

``` text
POST /predict/classification
POST /predict/severity
GET  /health
```

Node backend communicates with the Python service.

Architecture:

``` text
React
  ↓
Node/Express
  ↓
Python AI Service
  ↓
ML Model
```

This separation makes model replacement easier.

------------------------------------------------------------------------

# 24. AI Model Files

Keep trained models outside the main application code.

Example:

``` text
ai-service/
├── models/
│   ├── incident_classifier.joblib
│   ├── vectorizer.joblib
│   └── severity_model.joblib
│
├── training/
├── inference/
├── preprocessing/
└── main.py
```

Always store:

``` text
model version
training dataset version
features
metrics
training date
```

with each production/demo model.

------------------------------------------------------------------------

# 25. Model Evaluation

Classification should report:

-   Accuracy
-   Precision
-   Recall
-   F1-score
-   Confusion matrix
-   Per-class performance

For severity classification:

-   Accuracy
-   Macro F1
-   Confusion matrix

Do not report a model as successful only because of accuracy if classes
are imbalanced.

------------------------------------------------------------------------

# 26. Analytics Engine

The analytics engine should produce:

### Category analytics

``` text
Theft: 32%
Harassment: 18%
Vandalism: 15%
...
```

### Temporal analytics

``` text
Reports by hour
Reports by day
Reports by week
Reports by month
```

### Geographic analytics

``` text
Reports by area
Incident density
Hotspot cells
```

### Severity analytics

``` text
Low
Medium
High
Critical
```

### Status analytics

``` text
Submitted
Under Review
Verified
Investigating
Resolved
Rejected
```

------------------------------------------------------------------------

# 27. Hotspot Implementation

For the first version, use a grid-based method.

Example:

``` text
City
 ↓
Divide into geographic cells
 ↓
Count incidents per cell
 ↓
Normalize counts
 ↓
Calculate risk/density score
 ↓
Render high-density cells
```

A simple risk score can combine normalized:

``` text
incident density
+
recent activity
+
category weighting
+
temporal concentration
```

Keep the formula transparent and configurable.

Do not claim that a hotspot means a location is inherently dangerous. It
represents observed incident concentration in the selected data/time
window.

------------------------------------------------------------------------

# 28. Storage for Evidence

Do not store large images/videos directly inside PostgreSQL.

Use object storage:

``` text
User
 ↓
Upload
 ↓
Object Storage
 ↓
Secure file URL
 ↓
Database stores metadata/reference
```

Possible storage choices:

-   Firebase Storage
-   AWS S3
-   Cloudinary
-   Supabase Storage

For the first local prototype, a local protected uploads directory can
be used.

------------------------------------------------------------------------

# 29. Authentication and Security

Implement:

-   Password hashing
-   JWT authentication
-   Role-based authorization
-   Input validation
-   File-type validation
-   File-size limits
-   Rate limiting
-   CORS configuration
-   HTTPS in deployment
-   Secure HTTP headers
-   Audit logging
-   Environment variables for secrets

Never place:

``` text
DATABASE_PASSWORD
JWT_SECRET
API_KEYS
CLOUD_KEYS
```

inside frontend source code.

Use `.env`.

------------------------------------------------------------------------

# 30. Privacy and Moderation

TRACE must have privacy controls from the beginning.

Public users should not see:

-   Reporter name
-   Email
-   Phone
-   Private evidence
-   Exact sensitive locations where inappropriate
-   Internal moderation notes
-   Unverified personal accusations

Public map data should use suitable verification and aggregation rules.

Possible public visibility states:

``` text
PRIVATE
PENDING_REVIEW
PUBLIC_AGGREGATED
PUBLIC_VERIFIED
```

------------------------------------------------------------------------

# 31. Emergency Disclaimer

The application should clearly communicate:

> TRACE is a reporting, awareness and analytics platform. It does not
> replace emergency services or official police reporting channels.

Emergency situations should be directed to the appropriate official
emergency channel.

------------------------------------------------------------------------

# 32. Recommended Project Structure

``` text
TRACE/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── map/
│   │   ├── charts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── validators/
│   │   ├── sockets/
│   │   ├── analytics/
│   │   └── utils/
│   └── package.json
│
├── ai-service/
│   ├── models/
│   ├── training/
│   ├── preprocessing/
│   ├── inference/
│   ├── datasets/
│   └── main.py
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── synthetic/
│
├── docs/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

------------------------------------------------------------------------

# 33. Development Environment

Recommended local stack:

``` text
Node.js
Python 3.11+
PostgreSQL
PostGIS
Git
VS Code
```

Optional:

``` text
Docker
Docker Compose
```

Docker Compose can eventually run:

``` text
frontend
backend
ai-service
postgres/postgis
```

------------------------------------------------------------------------

# 34. Development Order

Do NOT ask Code Assist to build the entire application in one prompt.

Build it incrementally.

## Phase 1 --- Foundation

Create:

-   Monorepo/folder structure
-   React + Vite + TypeScript
-   Node + Express + TypeScript
-   Python FastAPI service
-   PostgreSQL/PostGIS connection
-   Environment configuration
-   Basic health endpoints

Goal:

``` text
All services start successfully.
```

------------------------------------------------------------------------

## Phase 2 --- Database

Implement:

-   Users
-   Incidents
-   Media metadata
-   Notifications
-   Audit logs
-   Spatial geometry
-   Spatial indexes
-   Migrations
-   Seed data

Goal:

``` text
Database contains realistic TRACE data.
```

------------------------------------------------------------------------

## Phase 3 --- Authentication

Implement:

-   Registration
-   Login
-   JWT
-   Protected routes
-   Citizen role
-   Moderator role
-   Admin role

Goal:

``` text
Users can securely access role-specific features.
```

------------------------------------------------------------------------

## Phase 4 --- Map First

Build the map before the rest of the dashboard.

Implement:

-   Leaflet
-   OpenStreetMap tiles
-   Search
-   Zoom
-   Pan
-   Locate user
-   Bounding-box queries
-   Marker clustering
-   Filters
-   Incident popup

Goal:

**The map must remain smooth with thousands of simulated incidents.**

------------------------------------------------------------------------

## Phase 5 --- Reporting

Build:

``` text
Report Incident
```

with:

-   Description
-   Location picker
-   Category
-   Date/time
-   Optional media

Connect it to the backend.

Goal:

``` text
Citizen submits → database stores → report appears on authorized map.
```

------------------------------------------------------------------------

## Phase 6 --- AI

Implement:

1.  Dataset preparation
2.  Text preprocessing
3.  TF-IDF
4.  Classification model
5.  Severity model/rules
6.  Evaluation
7.  FastAPI inference
8.  Node integration

Goal:

``` text
Report text
   ↓
AI category
   ↓
Confidence
   ↓
Severity
```

------------------------------------------------------------------------

## Phase 7 --- Analytics

Implement:

-   Category charts
-   Time trends
-   Geographic distribution
-   Severity distribution
-   Hotspot detection
-   Heatmap

Goal:

``` text
Raw incidents → meaningful visual intelligence
```

------------------------------------------------------------------------

## Phase 8 --- Admin Dashboard

Implement:

-   Report queue
-   Review
-   Verification
-   Status changes
-   Map
-   Analytics
-   User management
-   Audit logs

------------------------------------------------------------------------

## Phase 9 --- Real-Time

Add:

-   Socket.IO
-   Live report events
-   Live dashboard counters
-   Status updates
-   Notifications

Only send necessary events.

------------------------------------------------------------------------

## Phase 10 --- Performance Optimization

Test with:

``` text
1,000 incidents
10,000 incidents
50,000 incidents
100,000 incidents
```

Measure:

-   Initial map load
-   Pan latency
-   Zoom latency
-   API response time
-   Marker rendering
-   Memory usage

Optimize before adding unnecessary features.

------------------------------------------------------------------------

# 35. Map Performance Test

The project should have a specific performance test.

Seed the database with at least:

``` text
10,000+
```

incident records.

Then test:

``` text
Zoom
Pan
Search
Filter
Heatmap
Cluster expansion
Map refresh
```

The browser should never receive all 10,000 records simply because they
exist.

The API should return only the required geographic/aggregated data.

------------------------------------------------------------------------

# 36. Frontend Performance Principles

Use:

-   Lazy-loaded routes
-   Code splitting
-   React Query caching
-   Memoized expensive components
-   Debounced filters/search
-   Virtualized long lists
-   Marker clustering
-   Canvas for dense visualizations
-   Viewport-based API queries
-   Request cancellation
-   Avoid unnecessary global state
-   Avoid rerendering the entire map when a side panel changes

The map component should be isolated from unrelated React state.

------------------------------------------------------------------------

# 37. Backend Performance Principles

Use:

-   PostGIS spatial indexes
-   Database indexes on frequently filtered columns
-   Pagination
-   Bounding-box queries
-   Aggregation queries
-   Cached analytics
-   Precomputed hotspot snapshots
-   Connection pooling
-   Async AI processing
-   API response limits

Never run expensive full-database spatial calculations for every map
movement.

------------------------------------------------------------------------

# 38. API Response Design for Maps

A map response should be compact.

Example:

``` json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [73.8567, 18.5204]
      },
      "properties": {
        "id": "INC-001",
        "category": "THEFT_SNATCHING",
        "severity": "MEDIUM",
        "status": "VERIFIED"
      }
    }
  ]
}
```

Use GeoJSON for interoperability with the GIS layer.

Do not send unnecessary fields such as:

``` text
password
email
phone
internal notes
large descriptions
media
audit history
```

in the map endpoint.

------------------------------------------------------------------------

# 39. UX Design

TRACE should feel like a modern safety-intelligence application rather
than a traditional government form.

Main layout:

``` text
┌───────────────────────────────────────────────┐
│ TRACE      Map Reports Analytics Alerts      │
├──────────────┬────────────────────────────────┤
│ Filters      │                                │
│              │                                │
│ Categories   │          INTERACTIVE           │
│ Time         │             MAP                │
│ Severity     │                                │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
```

The map should dominate the main experience.

Analytics and report cards should complement the map rather than replace
it.

------------------------------------------------------------------------

# 40. Design System

Use a consistent visual system:

-   Dark navy / blue base
-   White/light surfaces
-   Red/orange for alerts or high severity
-   Green for verified/low-risk states
-   Yellow for medium states
-   Clear typography
-   Rounded cards
-   Subtle shadows
-   Minimal animation
-   Accessible contrast

Do not use excessive animations on the map.

------------------------------------------------------------------------

# 41. Notifications

Possible notification triggers:

``` text
Report status changed
Nearby verified incident
High-priority local alert
Report requires additional information
```

For the prototype, notifications can initially be:

-   In-app notifications
-   Browser notifications where permitted

Email/SMS/push can be added later.

------------------------------------------------------------------------

# 42. Logging and Monitoring

Backend should log:

``` text
request
user
endpoint
response status
error
latency
```

AI service should log:

``` text
model version
prediction request
prediction latency
prediction result
```

Do not log sensitive personal information unnecessarily.

------------------------------------------------------------------------

# 43. What We Should NOT Build Initially

Avoid scope explosion.

Do not initially build:

-   Native Android/iOS applications
-   Complex deep-learning transformer pipeline
-   Facial recognition
-   CCTV integration
-   Police/CCTNS integration
-   Automatic police dispatch
-   Fully autonomous crime prediction
-   Blockchain
-   Complex route optimization
-   Voice assistant
-   Social media integration
-   Large microservice architecture

These can be future scope.

The core prototype must work first.

------------------------------------------------------------------------

# 44. Minimum Viable TRACE

The minimum successful version is:

``` text
Authentication
      ↓
Incident Reporting
      ↓
PostgreSQL/PostGIS
      ↓
AI Classification
      ↓
Severity
      ↓
Interactive Map
      ↓
Filters + Clusters + Heatmap
      ↓
Hotspot Analytics
      ↓
Admin Verification
      ↓
Real-Time Updates
```

If all of these work reliably, TRACE has a complete end-to-end
prototype.

------------------------------------------------------------------------

# 45. Final Target Architecture

``` text
                         ┌──────────────────────┐
                         │       CITIZEN        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ React + Vite + TS    │
                         │ Tailwind             │
                         │ Leaflet Map          │
                         └──────────┬───────────┘
                                    │ REST / WebSocket
                                    ▼
                         ┌──────────────────────┐
                         │ Node.js + Express    │
                         │ API / Auth / RBAC     │
                         └───────┬──────┬───────┘
                                 │      │
                  ┌──────────────┘      └────────────────┐
                  ▼                                       ▼
       ┌─────────────────────┐                ┌─────────────────────┐
       │ PostgreSQL + PostGIS│                │ Python FastAPI AI   │
       │                     │                │                     │
       │ Users               │                │ NLP Classification  │
       │ Incidents           │                │ Severity            │
       │ Locations           │                │ Model Inference     │
       │ Status              │                └─────────────────────┘
       │ Notifications       │
       │ Audit Logs          │
       └──────────┬──────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │ Analytics Engine    │
       │                     │
       │ Trends              │
       │ Density             │
       │ Hotspots            │
       │ Temporal Patterns   │
       └──────────┬──────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │ Socket.IO           │
       │ Real-Time Events    │
       └──────────┬──────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │ Citizen / Admin UI  │
       │ Map / Dashboard     │
       │ Alerts / Reports    │
       └─────────────────────┘
```

------------------------------------------------------------------------

# 46. What Code Assist Should Build

Code Assist should treat this file as the **technical source of truth
for the implementation**.

It should:

1.  Build the application incrementally.
2.  Never rewrite working modules unnecessarily.
3.  Keep frontend, backend and AI service separated.
4.  Use TypeScript in the frontend/backend.
5.  Use Python for AI.
6.  Use PostgreSQL + PostGIS.
7.  Use migrations rather than manually changing production schemas.
8.  Create reusable components.
9.  Keep API contracts typed and documented.
10. Keep secrets in `.env`.
11. Add error handling to every API.
12. Add loading/empty/error states to every major UI.
13. Add validation on both frontend and backend.
14. Add role-based access control.
15. Add tests for critical backend and AI functionality.
16. Keep the map optimized for large datasets.
17. Never load the entire incident database into the browser.
18. Use viewport/bounding-box queries.
19. Use clustering/aggregation at lower zoom levels.
20. Keep AI inference asynchronous where needed.
21. Keep privacy controls in the architecture rather than adding them
    later.
22. Maintain a clean README and setup instructions.

------------------------------------------------------------------------

# 47. First Coding Task

Do not start by building every page.

Start with the foundation:

``` text
TRACE/
├── frontend
├── backend
├── ai-service
├── database
└── data
```

Then make these four services work:

``` text
React frontend
       ↕
Node/Express backend
       ↕
PostgreSQL + PostGIS

Node/Express
       ↕
Python FastAPI AI
```

After that, build the **interactive map + database integration first**.

The map is the central component of TRACE, so its architecture must be
correct before adding large amounts of UI.

------------------------------------------------------------------------

# 48. Definition of Done

TRACE is ready for final demonstration when a complete demo can perform
this sequence:

``` text
1. User logs in
        ↓
2. Opens TRACE map
        ↓
3. Searches/selects a location
        ↓
4. Sees clustered incidents
        ↓
5. Zooms into an area
        ↓
6. Sees individual incidents
        ↓
7. Applies category/time filters
        ↓
8. Opens an incident
        ↓
9. Submits a new report
        ↓
10. AI classifies the report
        ↓
11. AI estimates preliminary severity
        ↓
12. Report is stored in PostGIS
        ↓
13. Admin sees the report
        ↓
14. Admin verifies/updates status
        ↓
15. Map/dashboard receives real-time update
        ↓
16. Analytics update
        ↓
17. Hotspot/trend information is visible
        ↓
18. User receives appropriate notification
```

This demonstrates the complete TRACE concept:

**REPORT → ANALYZE → MAP → UNDERSTAND → INFORM**

------------------------------------------------------------------------

# 49. Core Technology List

  Layer              Technology
  ------------------ ---------------------------------------------
  Frontend           React + Vite + TypeScript
  UI                 Tailwind CSS
  Maps               Leaflet + React-Leaflet
  Map Data           OpenStreetMap tiles
  Map Optimization   Clustering + viewport queries + aggregation
  Backend            Node.js + Express + TypeScript
  API                REST
  Real-Time          Socket.IO
  Database           PostgreSQL
  Spatial Database   PostGIS
  AI Service         Python + FastAPI
  ML                 Scikit-learn
  NLP                TF-IDF + classical classifier initially
  Analytics          Python/SQL/Node analytics
  Authentication     JWT
  Storage            Object storage for media
  Charts             Recharts or equivalent
  Testing            Backend/API + AI model tests
  Deployment         Docker-ready architecture
  Version Control    Git + GitHub

------------------------------------------------------------------------

# 50. Final Project Vision

TRACE should demonstrate that a modern web application can combine:

**Web Development + AI/ML + GIS + Databases + Real-Time Systems + Data
Analytics + Security**

into one coherent safety-intelligence platform.

The most important implementation priorities are:

1.  **Smooth interactive map**
2.  **Reliable incident reporting**
3.  **PostGIS-based spatial querying**
4.  **Useful AI classification**
5.  **Transparent preliminary severity analysis**
6.  **Hotspot and temporal analytics**
7.  **Admin verification workflow**
8.  **Real-time updates**
9.  **Privacy-aware public visualization**
10. **Clean, maintainable architecture**

The project should prioritize a **working, fast, demonstrable end-to-end
system** over adding a large number of loosely connected features.
