# TRACE --- Next Phase Ideas

## Purpose

This document defines the next implementation direction for **TRACE ---
Technology for Reporting, Analysis & Crime Evaluation**.

TRACE is an AI-assisted, real-time, geospatial incident reporting and
safety-intelligence platform.

The immediate goal is not to build every advanced feature at once. The
project should be implemented in controlled phases so the database, map
engine, dashboard, analytics, and AI layers are built on a stable
foundation.

------------------------------------------------------------------------

# 1. Current Project State

Phase 1 is complete.

### Frontend

-   React
-   Vite
-   TypeScript
-   Tailwind CSS v4
-   TRACE design system
-   Landing page
-   API proxy

### Backend

-   Node.js
-   Express
-   TypeScript
-   CORS
-   Helmet
-   Health endpoint

### AI Service

-   Python
-   FastAPI
-   Placeholder classification/severity endpoints

### Database/Data directories

-   `database/migrations/`
-   `database/seeds/`
-   `database/schema/`
-   `data/raw/`
-   `data/processed/`
-   `data/synthetic/`

### Services verified

-   Frontend: `http://localhost:5173`
-   Backend: `http://localhost:5000`
-   AI service: `http://localhost:8000`

PostgreSQL 18.6 is installed and `psql` works from PowerShell. PostGIS
Bundle 3.6.2 is installed.

------------------------------------------------------------------------

# 2. Main Product Direction

TRACE should have a professional geospatial analytics dashboard inspired
by the supplied crime-hotspot dashboard reference, without copying the
reference UI.

Target experience:

-   professional
-   clean
-   light by default
-   responsive
-   map-centric
-   data-driven
-   suitable for a B.Tech final-year demonstration
-   light/dark theme support

The map should be the primary visual element.

------------------------------------------------------------------------

# 3. Important Concept: Heatmap Is Not Necessarily AI

The project should clearly separate ordinary geospatial analytics from
machine learning.

## 3.1 Incident markers

Individual verified/public-safe incidents are displayed as map markers.

Each marker represents an incident stored in PostgreSQL/PostGIS.

This is normal geospatial visualization, not AI.

## 3.2 Heatmap

A heatmap represents incident density and answers:

> Where are incidents concentrated?

It can be generated from incident coordinates and spatial
density/aggregation.

Recommended technologies:

-   PostGIS
-   Leaflet
-   React-Leaflet
-   an appropriate Leaflet heatmap layer or canvas-based renderer

A basic heatmap does not require machine learning.

## 3.3 Clusters

When zoomed out, thousands of points should not be rendered
simultaneously.

Use cluster aggregation so the user sees values such as:

``` text
[124]     [31]

    [76]

              [18]
```

Zooming in reveals more detail and eventually individual incidents.

This is primarily a map-performance feature.

## 3.4 AI risk map

This is where machine learning can be introduced.

The AI system can estimate risk at a spatial and temporal level using
historical patterns:

``` text
Historical incidents
        ↓
Feature engineering
        ↓
ML risk model
        ↓
Risk probability
        ↓
Spatial risk grid
        ↓
Map visualization
```

Example:

``` json
{
  "grid_id": "18.520_73.856",
  "risk_score": 0.78,
  "risk_level": "HIGH"
}
```

Use wording such as **estimated risk**, **risk score**, and **model
confidence**. Do not claim that a crime will definitely occur.

------------------------------------------------------------------------

# 4. Recommended TRACE Map Layers

The map should support:

``` text
MAP LAYERS

☑ Incidents
☑ Heatmap
☐ Clusters
☐ AI Risk
```

### Incidents

Verified/public-safe incidents.

### Heatmap

Historical/current incident density.

### Clusters

Aggregated nearby incidents when zoomed out.

### AI Risk

Model-generated estimated risk by spatial grid and time window.

The layers should be independently switchable.

------------------------------------------------------------------------

# 5. Recommended Dashboard Layout

Use the reference's information architecture, but create an original
TRACE interface.

``` text
┌──────────────────────────────────────────────────────────────────┐
│ TRACE                         Search       Alerts     User  Theme │
├───────────────┬───────────────────────────────────┬──────────────┤
│               │                                   │              │
│ NAVIGATION    │                                   │ ANALYTICS    │
│               │          INTERACTIVE MAP          │              │
│ Overview      │                                   │ KPI Cards    │
│ Live Map      │                                   │ Charts       │
│ Reports       │                                   │ Hotspots     │
│ Analytics     │                                   │ AI Risk      │
│ Hotspots      │                                   │ Insights     │
│ Alerts        │                                   │              │
└───────────────┴───────────────────────────────────┴──────────────┘
```

The map should occupy approximately 60--70% of the central dashboard
area.

Possible navigation:

``` text
Overview

MAP
  Live Map
  Heatmap
  Hotspots

REPORTS
  Submit Report
  My Reports

ANALYTICS
  Trends
  Categories
  Severity

ADMIN
  Verification
  Alerts

Settings
```

Admin-only functionality must be protected by backend RBAC, not merely
hidden in the frontend.

------------------------------------------------------------------------

# 6. Main Map Design

Required controls:

### Search

`Search location...`

### Zoom

`+ / -`

### Layer selector

``` text
☑ Incidents
☑ Heatmap
☐ Clusters
☐ AI Risk
```

### Filters

-   Category
-   Severity
-   Date range
-   Time range
-   Status

The public map should expose only records equivalent to:

``` text
status = VERIFIED
AND
is_public = true
```

Never expose private reporter information, moderation data, or private
evidence.

------------------------------------------------------------------------

# 7. Analytics Panel

The right side of the dashboard should provide contextual analytics.

Example sections:

### KPI

``` text
TOTAL INCIDENTS
1,482
```

### Incident categories

``` text
Theft        █████████
Assault      ███████
Burglary     █████
Robbery      ████
Other        ██████
```

### Top hotspots

``` text
1. Central District
2. Market Area
3. East Zone
4. Riverside
```

### AI risk

``` text
AI RISK

Central District

Risk Score: 0.78
Level: HIGH
Model Confidence: 0.84
```

Use neutral wording such as **estimated risk** and avoid presenting
predictions as certainties.

------------------------------------------------------------------------

# 8. Light and Dark Theme

Light mode should be the default.

### Light mode

-   light gray/white background
-   white cards
-   dark navy text
-   subtle borders
-   blue primary accent
-   restrained severity colors

### Dark mode

-   deep navy/slate background
-   dark cards
-   light text
-   muted borders
-   blue primary accent
-   restrained severity colors

Use Tailwind dark-mode support and persist the user's preference
locally.

------------------------------------------------------------------------

# 9. Database Direction

Use:

``` text
PostgreSQL 18.6
+
PostGIS 3.6.2
```

Create:

``` text
trace_db
```

Then enable:

``` sql
CREATE EXTENSION postgis;
```

At minimum, create:

``` text
users
incidents
incident_media
incident_analysis
notifications
audit_logs
hotspot_snapshots
risk_grid
```

A future `risk_grid` structure can contain:

``` text
id
cell_geometry
risk_score
risk_level
model_version
time_window
generated_at
```

------------------------------------------------------------------------

# 10. Spatial Indexing and Map Performance

The `incidents.location` field should use a PostGIS spatial type such
as:

``` text
geometry(Point, 4326)
```

Create an appropriate GiST spatial index.

Also create normal indexes for frequently queried fields such as:

-   status
-   category
-   severity
-   incident timestamp
-   created timestamp
-   reporter/user ID

Never load all incidents into the browser.

The future map API should support viewport/bounding-box queries:

``` http
GET /api/incidents?bbox=minLng,minLat,maxLng,maxLat
```

Use:

1.  bounding-box queries
2.  PostGIS spatial indexes
3.  marker clustering
4.  zoom-dependent representation
5.  server-side aggregation
6.  debounced map movement
7.  stale-request cancellation/ignoring
8.  React Query caching
9.  response limits/pagination
10. separate marker/heatmap/analytics requests
11. Canvas where appropriate
12. isolated map state

Zoom strategy:

``` text
Low zoom
    ↓
Aggregated density/grid
    ↓
Clusters
    ↓
Individual incidents
```

------------------------------------------------------------------------

# 11. AI Architecture

The existing Python FastAPI service remains separate.

Node/Express should communicate with FastAPI.

## Incident classification

Initial approach:

``` text
description
    ↓
TF-IDF
    ↓
Logistic Regression or Linear SVM
    ↓
category + confidence
```

Example:

``` json
{
  "category": "BURGLARY",
  "confidence": 0.91
}
```

## Preliminary severity

Example:

``` json
{
  "severity": "HIGH",
  "confidence": 0.83
}
```

These are AI-assisted preliminary outputs. Human moderation remains
authoritative.

------------------------------------------------------------------------

# 12. Future AI Risk Model

Do not start this before the incident data and basic map analytics are
stable.

Potential features:

``` text
latitude
longitude
hour
day_of_week
month
category
recent incident count
7-day incident count
30-day incident count
nearby incident density
historical category frequency
```

Architecture:

``` text
Historical incidents
        ↓
Feature engineering
        ↓
Spatial-temporal model
        ↓
Risk probability
        ↓
Spatial risk grid
        ↓
PostGIS
        ↓
Frontend AI Risk layer
```

The output should be framed as estimated risk, not certainty.

------------------------------------------------------------------------

# 13. Hotspot Analytics

Start with deterministic spatial analytics:

``` text
Incident points
      ↓
Spatial grid
      ↓
Incident count/density
      ↓
Hotspot score
```

Potential later methods:

-   DBSCAN
-   Kernel Density Estimation
-   spatial clustering
-   time-windowed density
-   category-specific density

Advanced methods are not a Phase 2 dependency.

------------------------------------------------------------------------

# 14. Development Order

## Phase 2 --- Database

1.  Create `trace_db`
2.  Enable PostGIS
3.  Create schema
4.  Add constraints
5.  Add spatial indexes
6.  Add normal indexes
7.  Create seed scripts
8.  Generate/import 10K+ realistic synthetic incidents
9.  Verify spatial queries

## Phase 3 --- Map Engine

1.  Map component
2.  Base map
3.  Incident markers
4.  Bounding-box API
5.  Clustering
6.  Filters
7.  Heatmap
8.  Hotspot aggregation
9.  Performance optimization

## Phase 4 --- Dashboard

1.  Dashboard shell
2.  Sidebar
3.  Top bar
4.  Map-centric layout
5.  KPI cards
6.  Analytics charts
7.  Hotspot panel
8.  AI insight card
9.  Light/dark mode

## Phase 5 --- AI/NLP

1.  Incident classification
2.  Confidence
3.  Preliminary severity
4.  Node ↔ FastAPI integration
5.  Store AI results
6.  Human verification workflow

## Phase 6 --- AI Risk Map

1.  Define spatial grid
2.  Create temporal/spatial features
3.  Train baseline risk model
4.  Validate model
5.  Generate risk scores
6.  Store risk-grid results
7.  Display AI risk layer
8.  Add model version/time-window metadata

## Phase 7 --- Real-Time System

Use Socket.IO events:

``` text
incident:created
incident:updated
incident:verified
incident:resolved
notification:new
```

The map/dashboard should update without full page refresh.

------------------------------------------------------------------------

# 15. What Not to Build Yet

Avoid unnecessary complexity initially:

-   native mobile applications
-   complex transformer pipelines
-   facial recognition
-   CCTV integration
-   police/CCTNS integration
-   automatic dispatch
-   autonomous crime prediction claims
-   blockchain
-   route optimization
-   voice assistant
-   social media integration
-   large microservice architecture

------------------------------------------------------------------------

# 16. Minimum Successful TRACE

A strong minimum implementation is:

``` text
Authentication
      ↓
Incident reporting
      ↓
PostgreSQL + PostGIS
      ↓
AI category classification
      ↓
Preliminary severity
      ↓
Interactive map
      ↓
Markers + clustering
      ↓
Heatmap
      ↓
Filters
      ↓
Hotspot analytics
      ↓
Admin verification
      ↓
AI risk layer
      ↓
Real-time updates
```

Keep a clear distinction between:

``` text
Observed data
    ≠
AI prediction
```

and:

``` text
Unverified allegation
    ≠
Established fact
```

------------------------------------------------------------------------

# 17. Final Target Experience

The final TRACE dashboard should feel like a professional geospatial
intelligence application.

The central experience is:

``` text
TRACE

        ┌───────────────────────────┐
        │       INTERACTIVE MAP     │
        │                           │
        │  ●   ●     🔥             │
        │       🔥                  │
        │   ●        ●              │
        │          🔥               │
        └───────────────────────────┘

Layers:
☑ Incidents
☑ Heatmap
☐ Clusters
☐ AI Risk

Filters:
Category | Severity | Date | Time

Analytics:
Incidents | Trends | Hotspots | AI Risk
```

The supplied reference images are inspiration for information density
and map-centric layout, not assets or exact UI designs to copy.
