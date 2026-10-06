# TRACE Database Documentation (PostgreSQL 18.6 + PostGIS 3.6.2)

This directory contains the database schema definitions, PostGIS spatial configurations, migrations, seed generators, and verification suites for TRACE.

---

## 1. Setup Instructions (Windows / PostgreSQL 18)

### Step A: Connect to PostgreSQL and Create `trace_db`
In PowerShell:
```powershell
$env:PGPASSWORD = 'your_postgres_password';
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE trace_db;"
```

### Step B: Enable PostGIS Spatial Extension
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d trace_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d trace_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

---

## 2. Environment Variables

In `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trace_db
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trace_db
```

---

## 3. Schema & Migrations

To apply the complete production schema including spatial types, indexes, and triggers:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d trace_db -f "database/schema/001_initial_schema.sql"
```

### Required Tables Implemented:
1. `users` — Authentication, roles (`CITIZEN`, `MODERATOR`, `ADMIN`).
2. `incidents` — Core incident records with PostGIS `location GEOMETRY(Point, 4326)` and privacy flags.
3. `incident_media` — Evidence attachments and metadata.
4. `incident_analysis` — AI model inference results (predicted category, severity, confidence).
5. `notifications` — Real-time user alert records.
6. `audit_logs` — Administrative and security audit trail.
7. `hotspot_snapshots` — Deterministic spatial density grids (`GEOMETRY(Polygon, 4326)`).
8. `risk_grid` — Spatial polygons for AI risk probability layers (`GEOMETRY(Polygon, 4326)`).

---

## 4. Seeding (10,000+ Incidents)

To seed 10 demo users and 10,000 realistic geotagged Pune incidents:
```powershell
cd backend
npm run seed
```

---

## 5. Verification Commands

Run the comprehensive SQL verification test suite:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d trace_db -f "database/verify_database.sql"
```

This verifies:
- PostGIS 3.6 extension active
- All 8 tables present
- Spatial column SRID 4326 and Point/Polygon types
- GiST spatial indexes active (`idx_incidents_location`, `idx_hotspot_geometry`, `idx_risk_grid_geometry`)
- 10,000+ incident count
- 100% valid geometries (`invalid_points = 0`)
- Geographic bounds constrained to Pune bounding box (18.42 to 18.65 Lat, 73.75 to 74.00 Lng)
- Public map privacy separation (unverified records not flagged as public)
