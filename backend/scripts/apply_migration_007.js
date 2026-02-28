/**
 * apply_migration_007.js
 * Applies migration 007: add google_rating and review_count columns.
 * Run with: node scripts/apply_migration_007.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izxjagetliznjgozuscw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eGphZ2V0bGl6bmpnb3p1c2N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMzU0OSwiZXhwIjoyMDg3MDA5NTQ5fQ.2O168ayv877waUtkYtonNZ4BDnRnhycYsmPRrhV-rz4';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
});

async function checkColumns() {
    const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const spec = await specRes.json();
    const cols = Object.keys(spec?.definitions?.leads?.properties || {});
    return {
        google_rating: cols.includes('google_rating'),
        review_count: cols.includes('review_count'),
        all: cols,
    };
}

async function main() {
    console.log('='.repeat(60));
    console.log('Migration 007: Add google_rating + review_count');
    console.log('='.repeat(60));

    // Check current state
    const before = await checkColumns();
    console.log(`Before: google_rating=${before.google_rating}, review_count=${before.review_count}`);
    console.log(`Total columns: ${before.all.length}`);

    if (before.google_rating && before.review_count) {
        console.log('\n✅ Columns already exist! Migration not needed.');
        process.exit(0);
    }

    // Test direct INSERT with the new fields to check if they exist
    // (PostgREST OpenAPI may be cached, so test directly)
    const { error: testError } = await supabase
        .from('leads')
        .select('google_rating, review_count')
        .limit(1);

    if (!testError) {
        console.log('\n✅ Columns already exist in DB (OpenAPI was cached)!');
        console.log('No migration needed. Run a new discovery to populate ratings.');
        process.exit(0);
    }

    console.log('\n⚠️  Columns confirmed MISSING:', testError.message);
    console.log('\n📋 Cannot apply DDL via REST API (requires exec_sql RPC or direct connection).');
    console.log('\n👉 Please run this SQL in Supabase Studio SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/izxjagetliznjgozuscw/sql/new\n');
    console.log(`-- Migration 007: Add Missing Rating Columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS google_rating  NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS review_count   INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_leads_google_rating ON leads(google_rating);
CREATE INDEX IF NOT EXISTS idx_leads_review_count  ON leads(review_count);`);
    console.log('\nAfter running, all new discovery runs will save ratings.');
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
