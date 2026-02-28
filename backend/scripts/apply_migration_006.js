/**
 * apply_migration_006.mjs
 * Applies migration 006 to the live Supabase database using the JS client.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://izxjagetliznjgozuscw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eGphZ2V0bGl6bmpnb3p1c2N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMzU0OSwiZXhwIjoyMDg3MDA5NTQ5fQ.2O168ayv877waUtkYtonNZ4BDnRnhycYsmPRrhV-rz4';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
});

// All ALTER TABLE and CREATE INDEX statements for migration 006
const STATEMENTS = [
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_maps_uri TEXT`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS types TEXT[]`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_status VARCHAR(50)`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS primary_type_display_name VARCHAR(255)`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS pure_service_area_business BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS international_phone_number VARCHAR(30)`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS price_level VARCHAR(50)`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS regular_opening_hours JSONB`,
    `CREATE INDEX IF NOT EXISTS idx_leads_business_status ON leads(business_status)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_price_level ON leads(price_level)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_pure_service_area ON leads(pure_service_area_business)`,
];

// We use the "auth.uid()" trick — service role can insert into a dummy rpc
// The real approach: use the REST endpoint for running SQL with service_role
// Supabase exposes: POST /rest/v1/rpc/<function_name>
// Since no exec_sql function exists, we'll try applying via inserting into a helper
// Actually the cleanest supported way: use fetch to the supabase pg-meta endpoint

async function applyViaFetch(sql) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
        },
    });
    if (!res.ok) return { ok: false, error: 'REST not reachable' };

    // Use pg-meta SQL endpoint (available in hosted Supabase)
    const sqlRes = await fetch(`https://api.supabase.com/v1/projects/izxjagetliznjgozuscw/database/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // This would require management API key, not service role
        },
        body: JSON.stringify({ query: sql }),
    });
    return { ok: sqlRes.ok, status: sqlRes.status, body: await sqlRes.text() };
}

// Alternative: Run DDL by abusing upsert with a non-existent function
// The REAL reliable approach for Supabase without pg direct access:
// Use a Supabase Edge Function OR the pg connection string

async function tryDirectFetch(sql) {
    // Supabase provides a SQL HTTP endpoint when using the DB connection string
    // But for hosted projects, the management API is the only option for DDL
    // We can test if there's a /rest/v1/rpc/exec endpoint
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/run_migration`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            Prefer: 'return=representation',
        },
        body: JSON.stringify({ p_sql: sql }),
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
}

async function main() {
    console.log('='.repeat(60));
    console.log('Migration 006 — Live Supabase DB');
    console.log('='.repeat(60));

    // Test connectivity
    const { data: testData, error: testError } = await supabase
        .from('leads')
        .select('id')
        .limit(1);

    if (testError) {
        console.log('❌ Cannot connect:', testError.message);
        process.exit(1);
    }
    console.log('✅ Connected to Supabase (leads table accessible)\n');

    // Try to verify current columns first
    const specRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const spec = await specRes.json();
    const currentCols = Object.keys(spec?.definitions?.leads?.properties || {});
    console.log(`Current leads columns (${currentCols.length}):`, currentCols.join(', '));

    const newCols = ['google_maps_uri', 'types', 'business_status', 'primary_type_display_name',
        'pure_service_area_business', 'international_phone_number', 'price_level', 'regular_opening_hours'];
    const missing = newCols.filter(c => !currentCols.includes(c));

    if (missing.length === 0) {
        console.log('\n✅ All new columns already exist! Migration was already applied.');
        process.exit(0);
    }

    console.log(`\n⚠️  Missing columns: ${missing.join(', ')}`);
    console.log('\n📋 Migration cannot be applied automatically via REST API.');
    console.log('   The exec_sql RPC function does not exist in this project.');
    console.log('\n👉 Please apply migration 006 manually in Supabase Studio:');
    console.log('   https://supabase.com/dashboard/project/izxjagetliznjgozuscw/sql/new\n');
    console.log('   Paste this SQL:\n');
    console.log('-- ============================================');
    console.log('-- Migration 006: Add Google Places Enterprise Fields');
    console.log('-- ============================================');
    STATEMENTS.forEach(s => console.log(s + ';'));
    console.log();
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
