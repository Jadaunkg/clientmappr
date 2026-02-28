import 'dotenv/config.js';
import { createClient } from '@supabase/supabase-js';
import logger from '../src/utils/logger.js';

const DEFAULT_TARGET_COUNT = 100000;
const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_SOURCE = 'seed_benchmark';

const getArgValue = (name, fallback) => {
  const prefixed = `--${name}=`;
  const rawArg = process.argv.find((arg) => arg.startsWith(prefixed));

  if (!rawArg) {
    return fallback;
  }

  return rawArg.slice(prefixed.length);
};

const parseNumberArg = (name, fallback) => {
  const raw = getArgValue(name, `${fallback}`);
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

const randomFrom = (items, index) => {
  return items[index % items.length];
};

const buildLeadRecord = (index, nowIso) => {
  const categoryOptions = ['plumber', 'dentist', 'restaurant', 'electrician', 'salon', 'law_firm'];
  const cityOptions = ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Plano', 'Fort Worth'];
  const stateOptions = ['TX', 'CA', 'NY', 'FL'];
  const statusOptions = ['validated', 'new', 'enriched'];

  const city = randomFrom(cityOptions, index);
  const state = randomFrom(stateOptions, index);
  const category = randomFrom(categoryOptions, index);
  const hasWebsite = index % 3 !== 0;
  const latBase = 30.2672;
  const lngBase = -97.7431;

  return {
    business_name: `Benchmark Business ${index + 1}`,
    address: `${100 + (index % 9900)} Main St`,
    city,
    state,
    zip_code: `${73301 + (index % 9000)}`,
    phone: `+1${String(2000000000 + index).slice(0, 10)}`,
    website_url: hasWebsite ? `https://benchmark-${index + 1}.example.com` : null,
    has_website: hasWebsite,
    google_rating: Number((3 + ((index % 20) * 0.1)).toFixed(1)),
    review_count: (index % 500) + 1,
    business_category: category,
    latitude: Number((latBase + ((index % 100) * 0.001)).toFixed(6)),
    longitude: Number((lngBase - ((index % 100) * 0.001)).toFixed(6)),
    status: randomFrom(statusOptions, index),
    source: DEFAULT_SOURCE,
    external_place_id: `seed-${index + 1}`,
    source_updated_at: nowIso,
    last_synced_at: nowIso,
    freshness_score: Number((0.7 + ((index % 30) * 0.01)).toFixed(2)),
    updated_at: nowIso,
  };
};

const ensureSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

const clearPriorSeedData = async (supabase) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('source', DEFAULT_SOURCE);

  if (error) {
    throw new Error(`Failed to clean prior seed data: ${error.message}`);
  }
};

const getCurrentSeedCount = async (supabase) => {
  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('source', DEFAULT_SOURCE);

  if (error) {
    throw new Error(`Failed to count seed rows: ${error.message}`);
  }

  return count || 0;
};

const upsertBatch = async (supabase, batch) => {
  const { error } = await supabase
    .from('leads')
    .upsert(batch, { onConflict: 'source,external_place_id' });

  if (error) {
    throw new Error(`Failed to upsert batch: ${error.message}`);
  }
};

const main = async () => {
  const targetCount = parseNumberArg('count', DEFAULT_TARGET_COUNT);
  const batchSize = parseNumberArg('batch', DEFAULT_BATCH_SIZE);
  const cleanFirst = hasFlag('clean');
  const startedAt = Date.now();

  logger.info('Starting scale seed for leads', {
    targetCount,
    batchSize,
    cleanFirst,
  });

  const supabase = ensureSupabase();

  if (cleanFirst) {
    await clearPriorSeedData(supabase);
    logger.info('Cleaned prior benchmark seed rows');
  }

  const existingCount = await getCurrentSeedCount(supabase);
  const rowsToCreate = Math.max(targetCount - existingCount, 0);

  if (rowsToCreate === 0) {
    logger.info('Scale seed complete (no-op)', { existingCount });
    return;
  }

  logger.info('Seeding missing rows', { existingCount, rowsToCreate });

  const nowIso = new Date().toISOString();
  let created = 0;

  while (created < rowsToCreate) {
    const take = Math.min(batchSize, rowsToCreate - created);
    const offset = existingCount + created;

    const batch = Array.from({ length: take }, (_, localIndex) => {
      return buildLeadRecord(offset + localIndex, nowIso);
    });

    await upsertBatch(supabase, batch);
    created += take;

    if (created % (batchSize * 5) === 0 || created === rowsToCreate) {
      logger.info('Seed progress', {
        created,
        rowsToCreate,
        progressPct: Number(((created / rowsToCreate) * 100).toFixed(2)),
      });
    }
  }

  const finalCount = await getCurrentSeedCount(supabase);
  logger.info('Scale seed finished', {
    finalCount,
    durationMs: Date.now() - startedAt,
  });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Scale seed failed', { message: error.message });
    process.exit(1);
  });
