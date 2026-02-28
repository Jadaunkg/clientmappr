-- ============================================
-- Phase 1.2 Day 1 - Leads Foundation Migration
-- ============================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new'
    CHECK (status IN ('new', 'validated', 'enriched', 'archived')),
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'google_maps',
  ADD COLUMN IF NOT EXISTS external_place_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS freshness_score NUMERIC(5, 2) DEFAULT 100.0;

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_google_rating ON leads(google_rating);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_external_place_id ON leads(external_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(business_category);

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_source_place
  ON leads(source, external_place_id)
  WHERE external_place_id IS NOT NULL;
