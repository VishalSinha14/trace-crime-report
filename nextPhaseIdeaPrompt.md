# TRACE --- Next Phase Implementation Prompt for Code Assist

You are working inside the existing TRACE project:

**TRACE --- Technology for Reporting, Analysis & Crime Evaluation**

TRACE is an AI-assisted, real-time, geospatial incident reporting and
safety-intelligence platform.

The project has completed Phase 1. Do not rebuild the project from
scratch.

------------------------------------------------------------------------

# CURRENT STATE

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

### Database/data directories

``` text
database/
  migrations/
  seeds/
  schema/

data/
  raw/
  processed/
  synthetic/
```

### Verified services

``` text
Frontend   http://localhost:5173
Backend    http://localhost:5000
AI Service http://localhost:8000
```

Installed locally:

``` text
PostgreSQL 18.6
PostGIS 3.6.2
```

`psql` works from PowerShell.

------------------------------------------------------------------------

# DEVELOPMENT MODE

Implement incrementally.

Before changing files:

1.  Inspect the existing repository.
2.  Inspect frontend, backend, AI service, database directories, package
    files, environment files, and README.
3.  Reuse the existing architecture.
4.  Do not introduce a new framework unless genuinely required.
5.  Do not replace working components just for style.
6.  Keep frontend, backend, AI service, and database responsibilities
    separated.
7.  Verify the application after each major step.

The immediate objective is **Phase 2: PostgreSQL + PostGIS database
foundation**.

Do not attempt to build the complete AI risk prediction system yet.

------------------------------------------------------------------------

# PHASE 2 OBJECTIVE

Use:

``` text
PostgreSQL 18.6
PostGIS 3.6.2
```

Create:

``` text
trace_db
```

Enable:

``` sql
CREATE EXTENSION postgis;
```

Then implement the initial production-oriented schema.

------------------------------------------------------------------------

# REQUIRED TABLES

At minimum:

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

Choose exact fields based on the existing project specification and
code. Do not invent unrelated fields.

------------------------------------------------------------------------

# INCIDENT MODEL

The `incidents` table is the core table.

It should support:

-   incident ID
-   reporting user
-   title/summary
-   description
-   category
-   severity
-   status
-   incident timestamp
-   created timestamp
-   updated timestamp
-   latitude
-   longitude
-   PostGIS location geometry
-   public visibility flag
-   verification information
-   useful TRACE metadata

Use a PostGIS location such as:

``` text
geometry(Point, 4326)
```

Keep latitude/longitude if useful for API/UI interoperability, but use
PostGIS for spatial queries.

------------------------------------------------------------------------

# STATUS MODEL

Support:

``` text
SUBMITTED
UNDER_REVIEW
VERIFIED
FORWARDED
INVESTIGATING
RESOLVED
REJECTED
```

Human verification must remain authoritative.

------------------------------------------------------------------------

# RBAC

Roles:

``` text
CITIZEN
MODERATOR
ADMIN
```

## CITIZEN

Can: - submit incidents - view own reports - view own report status -
view verified/public-safe incidents

Cannot: - view other users' private reports - view unverified reports -
access moderation data - verify/reject - access admin APIs

## MODERATOR

Can: - view reports requiring review - inspect permitted evidence -
verify/reject - update incident status

Cannot manage system administrators.

## ADMIN

Can access authorized internal: - incidents - moderation - analytics -
users - audit logs - configuration

Never expose passwords/secrets.

Sensitive actions must be auditable.

### Security requirement

Backend/API authorization must enforce the rules. UI hiding is not
security.

Unauthorized requests should return appropriate `401` or `403`.

------------------------------------------------------------------------

# PUBLIC MAP SECURITY

Public map APIs should expose only records equivalent to:

``` text
status = VERIFIED
AND
is_public = true
```

Do not return:

-   reporter email
-   phone
-   authentication information
-   internal moderation notes
-   private evidence
-   sensitive audit information
-   other private user data

------------------------------------------------------------------------

# SPATIAL INDEXING

Use a PostGIS spatial field such as:

``` text
geometry(Point, 4326)
```

Create an appropriate GiST spatial index.

Also index frequently queried fields such as:

-   status
-   category
-   severity
-   incident timestamp
-   created timestamp
-   reporter/user ID

Document why important indexes exist.

------------------------------------------------------------------------

# SEED DATA

Create a reproducible seed process targeting:

``` text
10,000+ incidents
```

Use synthetic/demo data unless an approved public dataset is already
available.

Do not create fake real-world allegations about identifiable people.

Generate geographically coherent data for a defined demo region.

Use a fixed random seed so results are reproducible.

Include realistic:

-   categories
-   severity
-   statuses
-   timestamps
-   coordinates
-   descriptions
-   public/private state

Respect foreign keys and relationships.

------------------------------------------------------------------------

# HOTSPOT SNAPSHOTS

Create a structure for deterministic geospatial hotspot calculations.

Conceptual fields:

``` text
id
geometry
incident_count
density_score
category
time_window
generated_at
```

Do not build an advanced ML hotspot model during Phase 2.

------------------------------------------------------------------------

# RISK GRID

Create a structure for the future AI risk layer:

``` text
id
cell_geometry
risk_score
risk_level
model_version
time_window
generated_at
```

This is preparation only.

The database itself does not predict crime.

------------------------------------------------------------------------

# FUTURE MAP ARCHITECTURE

The future TRACE map will support four separate concepts:

``` text
Incident markers
      +
Heatmap
      +
Clusters
      +
AI risk layer
```

## Incident markers

Verified/public-safe incidents.

## Heatmap

Incident density. This is geospatial analytics and does not inherently
require AI.

## Clusters

Nearby incidents aggregated for map performance.

## AI Risk

Estimated risk generated from historical spatial-temporal features.

Do not call an ordinary density heatmap "AI".

------------------------------------------------------------------------

# FUTURE AI ARCHITECTURE

The existing Python FastAPI service will eventually provide:

## Classification

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

## Severity

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

# FUTURE AI RISK MODEL

Do not implement this during the first database task unless the existing
project is already ready.

Future architecture:

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

Possible features:

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

Frame output as:

``` text
estimated risk
risk score
model confidence
```

Never as a guaranteed future event.

------------------------------------------------------------------------

# FUTURE DASHBOARD

After the database and map API are stable, build an original dashboard
inspired by the supplied reference.

Target:

``` text
┌──────────────────────────────────────────────────────────────────┐
│ TRACE                         Search       Alerts     User  Theme │
├───────────────┬───────────────────────────────────┬──────────────┤
│               │                                   │              │
│ Navigation    │           INTERACTIVE MAP         │ Analytics    │
│               │                                   │              │
│ Overview      │                                   │ KPI cards    │
│ Live Map      │                                   │ Charts       │
│ Reports       │                                   │ Hotspots     │
│ Analytics     │                                   │ AI Risk      │
│ Hotspots      │                                   │ Insights     │
│ Alerts        │                                   │              │
└───────────────┴───────────────────────────────────┴──────────────┘
```

The map should occupy roughly 60--70% of the central dashboard.

Use a clean professional light theme by default and support dark mode
with Tailwind.

Persist theme preference locally.

------------------------------------------------------------------------

# MAP LAYERS

Eventually expose:

``` text
MAP LAYERS

☑ Incidents
☑ Heatmap
☐ Clusters
☐ AI Risk
```

Use a restrained, professional light-map presentation.

------------------------------------------------------------------------

# IMPLEMENTATION ORDER

## Step 1 --- Inspect

Inspect the repository and report:

-   current database files
-   package versions
-   environment variables
-   API conventions
-   TypeScript types
-   frontend structure
-   AI service structure

Do not modify files during inspection.

## Step 2 --- Database connection

Add a clean backend PostgreSQL connection layer.

Use environment variables.

Never hardcode passwords.

For example:

``` env
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/trace_db
```

Follow existing environment conventions if present.

## Step 3 --- Database setup documentation

Document exact Windows/PostgreSQL commands to:

1.  create `trace_db`
2.  connect to it
3.  enable PostGIS

Do not silently create databases from application startup.

## Step 4 --- Schema

Implement migrations/schema for:

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

## Step 5 --- Indexes

Implement appropriate spatial GiST and normal indexes.

## Step 6 --- Seed data

Implement reproducible synthetic seed generation targeting:

``` text
10,000+ incidents
```

## Step 7 --- Verification

Create SQL/scripts that verify:

-   database connection
-   PostGIS extension
-   table existence
-   spatial column type
-   spatial index existence
-   seed count
-   valid geometries

## Step 8 --- Map-ready backend groundwork

After the database works, prepare the incident repository/service layer
for:

``` http
GET /api/incidents
```

with future support for:

-   bbox
-   category
-   severity
-   status
-   date range
-   pagination/limit

Do not expose private or unverified data through public endpoints.

------------------------------------------------------------------------

# ACCEPTANCE CRITERIA

Phase 2 is complete only when:

### Database

``` text
trace_db exists
PostGIS enabled
```

### Schema

All required tables exist.

### Spatial

Incident location is a valid PostGIS spatial column.

### Indexing

Spatial and important query indexes exist.

### Seed

At least 10,000 reproducible synthetic incidents can be inserted.

### Backend

Backend connects without hardcoded credentials.

### Verification

SQL/script verification confirms the installation and schema.

### Security

Public/private and RBAC rules are represented in backend design.

### Documentation

README/database documentation includes: - setup commands - environment
variables - migration commands - seed commands - verification commands

------------------------------------------------------------------------

# DO NOT DO THESE THINGS

Do not:

-   rebuild Phase 1
-   replace React
-   replace Express
-   move AI into Node unnecessarily
-   install packages without need
-   hardcode database passwords
-   expose private user data
-   treat unverified reports as facts
-   call ordinary heatmaps AI
-   implement autonomous crime prediction
-   add CCTV/facial recognition
-   add police/CCTNS integration
-   add blockchain
-   build a mobile application
-   build advanced transformers before the baseline
-   load all incidents into the browser
-   render 10K+ individual markers simultaneously

------------------------------------------------------------------------

# AFTER PHASE 2

Do not automatically continue into all future phases.

When Phase 2 passes every acceptance criterion, report:

``` text
PHASE 2 COMPLETE
```

and summarize:

1.  files created/modified
2.  database tables
3.  indexes
4.  seed count
5.  verification results
6.  commands to run the database
7.  remaining issues

Then stop and wait for the next instruction.

Future sequence:

``` text
Phase 2
Database + PostGIS
        ↓
Phase 3
Map engine
        ↓
Phase 4
Dashboard
        ↓
Phase 5
AI/NLP
        ↓
Phase 6
AI Risk Map
        ↓
Phase 7
Real-time updates
        ↓
Final polish
```

Priority: correctness, maintainability, spatial performance, security,
and a professional user experience.
