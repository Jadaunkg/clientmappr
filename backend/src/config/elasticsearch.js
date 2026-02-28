import { Client } from '@elastic/elasticsearch';

const DEFAULT_INDEX = process.env.ELASTICSEARCH_LEADS_INDEX || 'leads_v1';
const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE;

let elasticClient;

export const leadsIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      normalizer: {
        lowercase_normalizer: {
          type: 'custom',
          filter: ['lowercase', 'asciifolding'],
        },
      },
    },
  },
  mappings: {
    dynamic: false,
    properties: {
      id: { type: 'keyword' },
      business_name: {
        type: 'text',
        fields: {
          raw: { type: 'keyword', ignore_above: 256 },
        },
      },
      business_category: { type: 'keyword', normalizer: 'lowercase_normalizer' },
      city: { type: 'keyword', normalizer: 'lowercase_normalizer' },
      state: { type: 'keyword', normalizer: 'lowercase_normalizer' },
      status: { type: 'keyword' },
      has_website: { type: 'boolean' },
      google_rating: { type: 'float' },
      review_count: { type: 'integer' },
      location: { type: 'geo_point' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
    },
  },
};

export const isElasticsearchConfigured = () => Boolean(ELASTICSEARCH_NODE);

const getAuthConfig = () => {
  if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
    return {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    };
  }

  return undefined;
};

export const getElasticsearchClient = () => {
  if (!isElasticsearchConfigured()) {
    throw new Error('ELASTICSEARCH_NODE is not configured');
  }

  if (!elasticClient) {
    elasticClient = new Client({
      node: ELASTICSEARCH_NODE,
      auth: getAuthConfig(),
      maxRetries: 3,
      requestTimeout: 5000,
    });
  }

  return elasticClient;
};

export const ensureLeadsIndex = async (indexName = DEFAULT_INDEX) => {
  const client = getElasticsearchClient();
  const exists = await client.indices.exists({ index: indexName });

  if (!exists) {
    await client.indices.create({
      index: indexName,
      ...leadsIndexMapping,
    });
  }

  return indexName;
};

export const checkElasticsearchHealth = async () => {
  if (!isElasticsearchConfigured()) {
    return { status: 'NOT_CONFIGURED', details: 'ELASTICSEARCH_NODE not set' };
  }

  try {
    const client = getElasticsearchClient();
    await client.ping();
    return { status: 'OK', details: 'Elasticsearch ping successful' };
  } catch (error) {
    return { status: 'FAILED', details: error.message };
  }
};
