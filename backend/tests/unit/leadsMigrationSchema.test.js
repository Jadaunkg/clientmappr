import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const migrationPath = path.resolve(process.cwd(), '../supabase/migrations/003_phase1_2_day1_leads_foundation.sql');

const readMigration = () => fs.readFileSync(migrationPath, 'utf8');

describe('Leads foundation migration', () => {
  test('adds required Day 1 lead columns', () => {
    const sql = readMigration();

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS status');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS source');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS external_place_id');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS source_updated_at');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS last_synced_at');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS freshness_score');
  });

  test('creates required indexes for query paths', () => {
    const sql = readMigration();

    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_leads_status');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_leads_google_rating');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_leads_created_at');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_leads_location');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_leads_category');
  });
});
