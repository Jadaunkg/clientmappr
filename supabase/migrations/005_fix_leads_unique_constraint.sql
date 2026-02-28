-- Add missing unique constraint to leads table for upsert

-- Drop the existing unique index to avoid naming conflicts
DROP INDEX IF EXISTS uq_leads_source_place;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS uq_leads_source_place;

-- Add formal constraint instead
ALTER TABLE leads 
  ADD CONSTRAINT uq_leads_source_place UNIQUE (source, external_place_id);
