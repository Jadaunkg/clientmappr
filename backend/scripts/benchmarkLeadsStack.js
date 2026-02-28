import 'dotenv/config.js';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import {
  isElasticsearchConfigured,
  getElasticsearchClient,
  ensureLeadsIndex,
} from '../src/config/elasticsearch.js';
import logger from '../src/utils/logger.js';

const DEFAULT_ITERATIONS = 15;
const DEFAULT_WARMUP = 3;

const getArgValue = (name, fallback) => {
  const prefixed = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefixed));
  return match ? match.slice(prefixed.length) : fallback;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const percentile = (sortedValues, pct) => {
  if (!sortedValues.length) {
    return 0;
  }

  const idx = Math.ceil((pct / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, idx))];
};

const summarize = (samples = []) => {
  if (!samples.length) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const total = samples.reduce((acc, value) => acc + value, 0);

  return {
    count: samples.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Number((total / samples.length).toFixed(2)),
    p95: Number(percentile(sorted, 95).toFixed(2)),
    p99: Number(percentile(sorted, 99).toFixed(2)),
  };
};

const measureAsync = async (fn) => {
  const started = performance.now();
  await fn();
  return performance.now() - started;
};

const buildSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required for DB benchmarking');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

const benchmarkDb = async ({ iterations, warmup }) => {
  const supabase = buildSupabase();
  const query = () => {
    return supabase
      .from('leads')
      .select('id,business_name,city,google_rating,status', { count: 'exact' })
      .eq('status', 'validated')
      .order('created_at', { ascending: false })
      .limit(20);
  };

  for (let i = 0; i < warmup; i += 1) {
    const { error } = await query();
    if (error) {
      throw new Error(`DB warmup failed: ${error.message}`);
    }
  }

  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const duration = await measureAsync(async () => {
      const { error } = await query();
      if (error) {
        throw new Error(error.message);
      }
    });

    samples.push(duration);
  }

  return summarize(samples);
};

const benchmarkApi = async ({ iterations, warmup }) => {
  const baseUrl = process.env.BENCHMARK_API_BASE_URL || 'http://localhost:5000/api/v1';

  const callApi = () => {
    return axios.post(`${baseUrl}/leads/search`, {
      page: 1,
      limit: 20,
      status: 'validated',
      sort_by: 'created_at',
      sort_order: 'desc',
    }, {
      timeout: 8000,
    });
  };

  for (let i = 0; i < warmup; i += 1) {
    await callApi();
  }

  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const duration = await measureAsync(async () => {
      await callApi();
    });
    samples.push(duration);
  }

  return summarize(samples);
};

const benchmarkElasticsearch = async ({ iterations, warmup }) => {
  if (!isElasticsearchConfigured()) {
    return {
      skipped: true,
      reason: 'ELASTICSEARCH_NODE not configured',
    };
  }

  const client = getElasticsearchClient();
  const indexName = await ensureLeadsIndex();

  const query = () => {
    return client.search({
      index: indexName,
      size: 20,
      sort: [{ created_at: { order: 'desc' } }],
      query: {
        bool: {
          filter: [{ term: { status: 'validated' } }],
        },
      },
    });
  };

  for (let i = 0; i < warmup; i += 1) {
    await query();
  }

  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const duration = await measureAsync(async () => {
      await query();
    });
    samples.push(duration);
  }

  return {
    skipped: false,
    ...summarize(samples),
  };
};

const evaluateTargets = ({ api, db, elasticsearch }) => {
  return {
    apiUnder500ms: api.avg < 500,
    dbUnder200ms: db.avg < 200,
    elasticsearchUnder50ms: elasticsearch.skipped ? null : elasticsearch.avg < 50,
  };
};

const main = async () => {
  const iterations = parsePositiveInt(getArgValue('iterations', `${DEFAULT_ITERATIONS}`), DEFAULT_ITERATIONS);
  const warmup = parsePositiveInt(getArgValue('warmup', `${DEFAULT_WARMUP}`), DEFAULT_WARMUP);

  logger.info('Starting benchmark run', { iterations, warmup });

  const [api, db, elasticsearch] = await Promise.all([
    benchmarkApi({ iterations, warmup }),
    benchmarkDb({ iterations, warmup }),
    benchmarkElasticsearch({ iterations, warmup }),
  ]);

  const targets = evaluateTargets({ api, db, elasticsearch });

  const summary = {
    generatedAt: new Date().toISOString(),
    iterations,
    warmup,
    api,
    db,
    elasticsearch,
    targets,
  };

  logger.info('Benchmark summary', summary);

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Benchmark failed', { message: error.message });
    process.exit(1);
  });
