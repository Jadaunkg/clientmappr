-- ============================================
-- Migration 007: Add Missing Rating Columns
-- ============================================
-- google_rating and review_count were defined in 001_initial_schema.sql
-- but the live database was created from a later snapshot that never
-- included them. This migration adds them safely with IF NOT EXISTS.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS google_rating  NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS review_count   INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_google_rating ON leads(google_rating);
CREATE INDEX IF NOT EXISTS idx_leads_review_count  ON leads(review_count);
