/**
 * check_live_schema_v2.js
 * Uses Supabase's PostgREST RPC endpoint to run a schema inspection query.
 * The trick: create a temporary function via the REST API isn't available,
 * but we CAN query system views by using the Supabase service role with
 * a direct fetch to the REST endpoint for views that ARE exposed.
 *
 * Strategy: Use the @supabase/supabase-js client with service role key
 * and call `.from('leads').select()` with limit 0 to get column metadata,
 * or alternatively call the Supabase Management API.
 */

// Use the project ref from the URL
const PROJECT_REF = 'izxjagetliznjgozuscw';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6eGphZ2V0bGl6bmpnb3p1c2N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMzU0OSwiZXhwIjoyMDg3MDA5NTQ5fQ.2O168ayv877waUtkYtonNZ4BDnRnhycYsmPRrhV-rz4';

const TABLES = ['leads', 'users', 'lead_discovery_runs', 'lead_discovery_leads', 'interactions', 'subscriptions', 'exports'];

//
// Method: Fetch with header X-Supabase-Api-Version which triggers column metadata
// in certain versions, OR use the /rest/v1/?select= approach with zero rows.
//
async function getColumnsViaSelect(table) {
    // Request with limit=0 — PostgREST returns empty array but includes column info
    // We also add 'Prefer: return=representation' to get the full OpenAPI response
    const url = `${SUPABASE_URL}/rest/v1/${table}?limit=0&select=*`;
    const res = await fetch(url, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
    });

    if (!res.ok) {
        const body = await res.text();
        return { error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    // Check if response has column definitions in headers or body
    const body = await res.json();
    return { rows: body, headers: Object.fromEntries(res.headers.entries()) };
}

// Use the OpenAPI spec exposed by PostgREST — this lists all table definitions
async function getOpenAPISpec() {
    const url = `${SUPABASE_URL}/rest/v1/`;
    const res = await fetch(url, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
    });

    if (!res.ok) {
        const body = await res.text();
        console.log(`OpenAPI: HTTP ${res.status}: ${body.slice(0, 300)}`);
        return null;
    }

    return res.json();
}

// Parse OpenAPI definitions to extract table schemas
function parseOpenAPIForTables(spec, tables) {
    if (!spec || !spec.definitions) {
        console.log('⚠️  No definitions in OpenAPI spec');
        console.log('Spec keys:', Object.keys(spec || {}));
        return;
    }

    console.log(`\nFound ${Object.keys(spec.definitions).length} definitions in OpenAPI spec`);

    for (const table of tables) {
        const def = spec.definitions[table];
        if (!def) {
            console.log(`\n⚠️  Table '${table}' not found in OpenAPI spec`);
            continue;
        }

        const props = def.properties || {};
        const required = def.required || [];

        console.log(`\n${'='.repeat(70)}`);
        console.log(`📋 TABLE: ${table}`);
        console.log(`${'='.repeat(70)}`);

        Object.entries(props).forEach(([colName, colDef]) => {
            const isRequired = required.includes(colName);
            const type = colDef.type || colDef.format || 'unknown';
            const format = colDef.format ? ` [${colDef.format}]` : '';
            const desc = colDef.description ? ` -- ${colDef.description}` : '';
            const nullable = !isRequired ? ' (nullable)' : ' (NOT NULL)';

            console.log(`  ${colName.padEnd(45)} ${(type + format).padEnd(25)}${nullable}${desc}`);
        });
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('ClientMapr — Live Supabase Schema via OpenAPI');
    console.log(`Project: ${PROJECT_REF}`);
    console.log('='.repeat(70));

    console.log('\n📡 Fetching OpenAPI spec from PostgREST...');
    const spec = await getOpenAPISpec();

    if (spec) {
        console.log('✅ Got OpenAPI spec');
        parseOpenAPIForTables(spec, TABLES);
    } else {
        console.log('❌ Could not get OpenAPI spec');
    }
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
