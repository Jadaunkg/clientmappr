-- ============================================
-- Migration 006: Add Google Places Enterprise Fields
-- ============================================
-- Adds the full set of Google Places API (New) field mask columns
-- to support Essentials, Pro, and Enterprise SKU tiers.
--
-- Confirmed against live schema (2026-02-28):
-- The leads table had 20 columns. google_maps_uri existed in backend
-- code but was never migrated — this migration adds it plus 7 new fields.

ALTER TABLE leads
  -- Fix: google_maps_uri was referenced in code but never migrated to live DB
  ADD COLUMN IF NOT EXISTS google_maps_uri              TEXT,

  -- ESSENTIALS TIER: all raw place type slugs (e.g. {"plumber","home_goods_store"})
  ADD COLUMN IF NOT EXISTS types                        TEXT[],

  -- PRO TIER: filter/status fields
  ADD COLUMN IF NOT EXISTS business_status              VARCHAR(50),
  --   Possible values from Places API (New):
  --   OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY

  ADD COLUMN IF NOT EXISTS primary_type_display_name    VARCHAR(255),
  --   Human-readable version of primaryType (e.g. "Plumber", "Italian Restaurant")

  ADD COLUMN IF NOT EXISTS pure_service_area_business   BOOLEAN DEFAULT FALSE,
  --   TRUE when the business serves customers at their location (plumber, cleaner)
  --   and has no physical storefront address

  -- ENTERPRISE TIER: contact & commercial data
  ADD COLUMN IF NOT EXISTS international_phone_number   VARCHAR(30),
  --   E.164-style with country code, e.g. "+1 512-555-1234"
  --   Preferred over `phone` (national format) for display

  ADD COLUMN IF NOT EXISTS price_level                  VARCHAR(50),
  --   Possible values: PRICE_LEVEL_FREE | PRICE_LEVEL_INEXPENSIVE |
  --   PRICE_LEVEL_MODERATE | PRICE_LEVEL_EXPENSIVE | PRICE_LEVEL_VERY_EXPENSIVE

  ADD COLUMN IF NOT EXISTS regular_opening_hours        JSONB;
  --   Structured JSON from Places API regularOpeningHours field:
  --   { weekdayDescriptions: ["Monday: 9:00 AM – 5:00 PM", ...],
  --     periods: [...] }

-- Indexes for filter operations on new columns
CREATE INDEX IF NOT EXISTS idx_leads_business_status ON leads(business_status);
CREATE INDEX IF NOT EXISTS idx_leads_price_level     ON leads(price_level);
CREATE INDEX IF NOT EXISTS idx_leads_pure_service_area ON leads(pure_service_area_business);
