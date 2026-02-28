-- ============================================
-- Phase 1.2 - Real-time Lead Discovery Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS lead_discovery_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'google_maps',
  query TEXT NOT NULL,
  city VARCHAR(100),
  business_category VARCHAR(100),
  has_website BOOLEAN,
  requested_limit INTEGER NOT NULL DEFAULT 20,
  status VARCHAR(30) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  job_id VARCHAR(100),
  discovered_count INTEGER NOT NULL DEFAULT 0,
  persisted_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  quality_meta JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_discovery_leads (
  discovery_run_id UUID NOT NULL REFERENCES lead_discovery_runs(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (discovery_run_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_discovery_runs_user_id
  ON lead_discovery_runs(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_discovery_runs_status
  ON lead_discovery_runs(status);

CREATE INDEX IF NOT EXISTS idx_lead_discovery_runs_created_at
  ON lead_discovery_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_discovery_runs_job_id
  ON lead_discovery_runs(job_id);

CREATE TRIGGER lead_discovery_runs_updated_at_trigger BEFORE UPDATE ON lead_discovery_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
