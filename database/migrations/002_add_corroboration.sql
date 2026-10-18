-- Citizen corroboration and audit metadata migration.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'CORROBORATED';

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS credibility_score INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS corroborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('WITNESSED', 'AFFECTED', 'FALSE_REPORT')),
  statement TEXT NOT NULL CHECK (char_length(statement) BETWEEN 10 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (incident_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_corroborations_incident
  ON corroborations(incident_id);
