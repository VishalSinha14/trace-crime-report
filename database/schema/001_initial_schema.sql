-- ============================================================================
-- TRACE Database Schema
-- Technology for Reporting, Analysis & Crime Evaluation
-- PostgreSQL 18 + PostGIS 3.6
-- ============================================================================

-- Enable PostGIS (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM Types ─────────────────────────────────────────────────────────────

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITIZEN', 'MODERATOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident categories (configurable list)
DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM (
    'THEFT_SNATCHING',
    'ASSAULT',
    'BURGLARY',
    'VANDALISM',
    'HARASSMENT',
    'FRAUD',
    'CYBERCRIME',
    'ROBBERY',
    'VEHICLE_RELATED',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident severity
DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident status
DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'VERIFIED',
    'FORWARDED',
    'INVESTIGATING',
    'RESOLVED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification type
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'STATUS_CHANGE',
    'NEARBY_INCIDENT',
    'HIGH_PRIORITY_ALERT',
    'INFO_REQUEST',
    'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Users Table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'CITIZEN',
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ─── Incidents Table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,

  -- User-provided category (optional, AI fills if empty)
  category        incident_category,

  -- AI-predicted category and confidence
  ai_category     incident_category,
  ai_confidence   DECIMAL(5,4),    -- 0.0000 to 1.0000

  -- Severity (AI-estimated or manually set)
  severity        incident_severity DEFAULT 'MEDIUM',

  -- Report lifecycle status
  status          incident_status NOT NULL DEFAULT 'SUBMITTED',

  -- Geospatial: PostGIS POINT (longitude, latitude) SRID 4326 = WGS84
  location        GEOMETRY(Point, 4326) NOT NULL,

  -- Denormalized lat/lng for easy reading (derived from location)
  latitude        DECIMAL(10, 7) NOT NULL,
  longitude       DECIMAL(10, 7) NOT NULL,

  -- Human-readable area name
  location_area   VARCHAR(255),

  -- When the incident occurred (may differ from report time)
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Privacy / public visibility flag
  is_public       BOOLEAN NOT NULL DEFAULT false,

  -- Moderation notes (admin-only)
  moderation_notes TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index (critical for bounding-box map queries)
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);

-- Frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at ON incidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_public ON incidents(is_public) WHERE is_public = true;

-- Composite index for public map queries (most common query)
CREATE INDEX IF NOT EXISTS idx_incidents_public_verified
  ON incidents(status, is_public)
  WHERE status = 'VERIFIED' AND is_public = true;

-- ─── Incident Media ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incident_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url      VARCHAR(1000) NOT NULL,
  file_type     VARCHAR(50) NOT NULL,     -- image/jpeg, image/png, video/mp4
  file_size     INTEGER,                  -- bytes
  original_name VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_media_incident ON incident_media(incident_id);

-- ─── Incident Analysis (AI results) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incident_analysis (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id           UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  predicted_category    incident_category NOT NULL,
  category_confidence   DECIMAL(5,4) NOT NULL,
  predicted_severity    incident_severity,
  severity_confidence   DECIMAL(5,4),
  model_version         VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  processing_time_ms    INTEGER,         -- How long AI took
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_analysis_incident ON incident_analysis(incident_id);

-- ─── Notifications ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  incident_id   UUID REFERENCES incidents(id) ON DELETE SET NULL,
  type          notification_type NOT NULL DEFAULT 'SYSTEM',
  title         VARCHAR(255) NOT NULL,
  message       TEXT NOT NULL,
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;

-- ─── Audit Logs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,    -- e.g. REPORT_CREATED, STATUS_CHANGED, USER_LOGIN
  entity_type   VARCHAR(50),              -- e.g. incident, user, notification
  entity_id     UUID,
  metadata      JSONB,                    -- Flexible extra data
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ─── Hotspot Snapshots (precomputed) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hotspot_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id         VARCHAR(50) NOT NULL,
  geometry        GEOMETRY(Polygon, 4326) NOT NULL,
  risk_score      DECIMAL(6,3) NOT NULL DEFAULT 0,
  incident_count  INTEGER NOT NULL DEFAULT 0,
  time_window     VARCHAR(50) NOT NULL,   -- e.g. 'last_7_days', 'last_30_days'
  category        incident_category,       -- NULL = all categories
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotspot_geometry ON hotspot_snapshots USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_hotspot_time_window ON hotspot_snapshots(time_window);

-- ─── Risk Grid (Structure for future AI Risk Layer) ──────────────────────────

CREATE TABLE IF NOT EXISTS risk_grid (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id         VARCHAR(50),
  cell_geometry   GEOMETRY(Polygon, 4326) NOT NULL,
  risk_score      DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  risk_level      VARCHAR(20) NOT NULL DEFAULT 'LOW',
  model_version   VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  time_window     VARCHAR(50) NOT NULL DEFAULT '30d',
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_grid_geometry ON risk_grid USING GIST(cell_geometry);
CREATE INDEX IF NOT EXISTS idx_risk_grid_level ON risk_grid(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_grid_window ON risk_grid(time_window);

-- ─── Updated-at trigger function ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply auto-update trigger to relevant tables
DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Verify Setup ───────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ TRACE schema created successfully';
  RAISE NOTICE '🌍 PostGIS: %', PostGIS_Version();
END $$;
