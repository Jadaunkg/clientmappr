import { createClient } from '@supabase/supabase-js';
import { buildLeadQueryPlan } from './leads/queryBuilder.js';
import { buildLeadsSearchCacheKey, LEADS_SEARCH_CACHE_TTL_SECONDS } from '../utils/cacheKeys.js';
import { getRedisClient, isRedisConfigured } from '../config/redis.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';
import { fetchPlacesByText } from './leads/googleMapsScraper.js';
import {
  normalizeLeadRecord,
  cleanLeadRecord,
  validateLeadRecord,
  deriveLeadMetadata,
  enrichLeadRecord,
} from './pipeline/leadPipeline.js';

const LEADS_SELECT_FIELDS = [
  'id',
  'business_name',
  'address',
  'city',
  'state',
  'zip_code',
  'phone',
  'website_url',
  'has_website',
  'business_category',
  'latitude',
  'longitude',
  'status',
  'source',
  'external_place_id',
  'source_updated_at',
  'last_synced_at',
  'freshness_score',
  'created_at',
  'updated_at',
  // Essentials tier
  'google_maps_uri',
  'types',
  // Pro tier
  'business_status',
  'primary_type_display_name',
  'pure_service_area_business',
  // Enterprise tier
  'international_phone_number',
  'price_level',
  'regular_opening_hours',
  // Ratings (missing from live DB until migration 007)
  'google_rating',
  'review_count',
].join(',');

const buildSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new AppError('Supabase is not configured', 500, 'SUPABASE_NOT_CONFIGURED');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

const applyLeadFilters = (query, filters = {}) => {
  let filteredQuery = query;

  if (filters.city) {
    filteredQuery = filteredQuery.ilike('city', `%${filters.city}%`);
  }

  if (filters.state) {
    filteredQuery = filteredQuery.ilike('state', `%${filters.state}%`);
  }

  if (filters.business_category) {
    filteredQuery = filteredQuery.ilike('business_category', `%${filters.business_category}%`);
  }

  if (filters.status) {
    filteredQuery = filteredQuery.eq('status', filters.status);
  }

  if (filters.has_website !== undefined) {
    filteredQuery = filteredQuery.eq('has_website', filters.has_website);
  }

  if (filters.created_after) {
    filteredQuery = filteredQuery.gte('created_at', filters.created_after);
  }

  if (filters.created_before) {
    filteredQuery = filteredQuery.lte('created_at', filters.created_before);
  }

  return filteredQuery;
};

const getCachedLeadSearchResult = async (cacheKey) => {
  if (!isRedisConfigured()) {
    return null;
  }

  try {
    const redisClient = await getRedisClient();
    const cachedValue = await redisClient.get(cacheKey);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue);
  } catch (error) {
    logger.warn('Lead search cache read failed', { message: error.message });
    return null;
  }
};

const setCachedLeadSearchResult = async (cacheKey, value) => {
  if (!isRedisConfigured()) {
    return;
  }

  try {
    const redisClient = await getRedisClient();
    await redisClient.setEx(cacheKey, LEADS_SEARCH_CACHE_TTL_SECONDS, JSON.stringify(value));
  } catch (error) {
    logger.warn('Lead search cache write failed', { message: error.message });
  }
};

export const invalidateLeadSearchCache = async () => {
  if (!isRedisConfigured()) {
    return 0;
  }

  try {
    const redisClient = await getRedisClient();
    const keys = await redisClient.keys('leads:search:*');

    if (!keys.length) {
      return 0;
    }

    return redisClient.del(keys);
  } catch (error) {
    logger.warn('Lead search cache invalidation failed', { message: error.message });
    return 0;
  }
};

export const searchLeads = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
} = {}) => {
  const queryPlan = buildLeadQueryPlan(filters, { page, limit, sortBy });

  const cacheKey = buildLeadsSearchCacheKey({
    filters: queryPlan.filters,
    page: queryPlan.pagination.page,
    limit: queryPlan.pagination.limit,
    sort: `${sortBy}_${sortOrder}`,
  });

  const cached = await getCachedLeadSearchResult(cacheKey);
  if (cached) {
    return {
      ...cached,
      cache: {
        key: cacheKey,
        hit: true,
      },
    };
  }

  const supabase = buildSupabaseClient();
  let query = supabase
    .from('leads')
    .select(LEADS_SELECT_FIELDS, { count: 'exact' });

  query = applyLeadFilters(query, queryPlan.filters);

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(queryPlan.pagination.offset, queryPlan.pagination.offset + queryPlan.pagination.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Lead search failed', { message: error.message });
    throw new AppError('Failed to search leads', 500, 'LEAD_SEARCH_FAILED');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / queryPlan.pagination.limit) || 0;

  const response = {
    leads: data || [],
    pagination: {
      page: queryPlan.pagination.page,
      limit: queryPlan.pagination.limit,
      total,
      totalPages,
    },
    queryPlan: {
      indexedFilters: queryPlan.indexedFilters,
      explainChecks: {
        usesIndexedFilter: queryPlan.indexedFilters.length > 0,
        selectedFieldCount: LEADS_SELECT_FIELDS.split(',').length,
      },
    },
  };

  await setCachedLeadSearchResult(cacheKey, response);

  return {
    ...response,
    cache: {
      key: cacheKey,
      hit: false,
    },
  };
};

export const getLeadById = async (leadId) => {
  const supabase = buildSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select(LEADS_SELECT_FIELDS)
    .eq('id', leadId)
    .single();

  if (error || !data) {
    throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  }

  return data;
};

export const updateLeadStatusById = async (leadId, status) => {
  const supabase = buildSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select(LEADS_SELECT_FIELDS)
    .single();

  if (error || !data) {
    throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  }

  await invalidateLeadSearchCache();
  return data;
};

export const softDeleteLeadById = async (leadId) => {
  const archived = await updateLeadStatusById(leadId, 'archived');
  return archived;
};

export const enrichLeadById = async ({ leadId, requestedBy, forceRefresh = false }) => {
  const startedAt = Date.now();

  const lead = await getLeadById(leadId);
  const query = [lead.business_name, lead.address, lead.city, lead.state]
    .filter(Boolean)
    .join(', ');

  logger.info('Lead enrichment started', {
    leadId,
    requestedBy,
    query,
    forceRefresh,
  });

  const providerResults = await fetchPlacesByText({ query });

  if (!providerResults.length) {
    throw new AppError('No enrichment data found for this lead', 404, 'LEAD_ENRICHMENT_NO_RESULTS');
  }

  const providerLead = providerResults[0];

  const normalized = normalizeLeadRecord({
    ...lead,
    ...providerLead,
    external_place_id: providerLead.external_place_id || lead.external_place_id,
    source: 'google_maps',
  });
  const cleaned = cleanLeadRecord(normalized);
  const validation = validateLeadRecord(cleaned);

  if (!validation.isValid) {
    throw new AppError(
      `Lead enrichment validation failed: ${validation.errors.join(', ')}`,
      422,
      'LEAD_ENRICHMENT_VALIDATION_FAILED',
    );
  }

  const metadata = deriveLeadMetadata(cleaned);
  const enriched = enrichLeadRecord(cleaned, {
    ...metadata,
    status: 'enriched',
  });

  const supabase = buildSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .update({
      business_name: enriched.business_name,
      address: enriched.address,
      city: enriched.city,
      state: enriched.state,
      zip_code: enriched.zip_code,
      phone: enriched.phone,
      website_url: enriched.website_url,
      has_website: enriched.has_website,
      business_category: enriched.business_category,
      latitude: enriched.latitude,
      longitude: enriched.longitude,
      status: enriched.status,
      source: enriched.source,
      external_place_id: enriched.external_place_id,
      source_updated_at: enriched.source_updated_at,
      last_synced_at: enriched.last_synced_at,
      freshness_score: enriched.freshness_score,
      // Essentials tier
      google_maps_uri: enriched.google_maps_uri || null,
      types: Array.isArray(enriched.types) ? enriched.types : null,
      // Pro tier
      business_status: enriched.business_status || null,
      primary_type_display_name: enriched.primary_type_display_name || null,
      pure_service_area_business: Boolean(enriched.pure_service_area_business),
      // Enterprise tier
      international_phone_number: enriched.international_phone_number || null,
      price_level: enriched.price_level || null,
      regular_opening_hours: enriched.regular_opening_hours || null,
      // Ratings
      google_rating: enriched.google_rating != null ? Number(enriched.google_rating) : null,
      review_count: enriched.review_count != null ? Number(enriched.review_count) : 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .select(LEADS_SELECT_FIELDS)
    .single();

  if (error || !data) {
    logger.error('Lead enrichment persistence failed', { leadId, message: error?.message });
    throw new AppError('Failed to persist enriched lead data', 500, 'LEAD_ENRICHMENT_PERSIST_FAILED');
  }

  await invalidateLeadSearchCache();

  logger.info('Lead enrichment completed', {
    leadId,
    requestedBy,
    durationMs: Date.now() - startedAt,
  });

  return data;
};

export default {
  searchLeads,
  getLeadById,
  updateLeadStatusById,
  softDeleteLeadById,
  enrichLeadById,
  invalidateLeadSearchCache,
};
