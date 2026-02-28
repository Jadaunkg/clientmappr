const ALLOWED_FILTERS = new Set([
  'city',
  'state',
  'business_category',
  'status',
  'has_website',
  'min_rating',
  'max_rating',
  'created_after',
  'created_before',
]);

const INDEXED_FILTER_MAP = {
  city: 'idx_leads_city',
  state: 'idx_leads_state',
  business_category: 'idx_leads_category',
  status: 'idx_leads_status',
  has_website: 'idx_leads_has_website',
  min_rating: 'idx_leads_google_rating',
  max_rating: 'idx_leads_google_rating',
  created_after: 'idx_leads_created_at',
  created_before: 'idx_leads_created_at',
};

const sanitizeFilters = (filters = {}) => {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (!ALLOWED_FILTERS.has(key)) {
      return;
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

export const buildLeadQueryPlan = (filters = {}, options = {}) => {
  const sanitizedFilters = sanitizeFilters(filters);
  const page = Math.max(Number(options.page || 1), 1);
  const limit = Math.min(Math.max(Number(options.limit || 20), 1), 100);
  const offset = (page - 1) * limit;

  const indexedFilters = Object.keys(sanitizedFilters)
    .map((key) => INDEXED_FILTER_MAP[key])
    .filter(Boolean);

  return {
    filters: sanitizedFilters,
    pagination: {
      page,
      limit,
      offset,
    },
    indexedFilters,
    suggestedOrderBy: options.sortBy || 'created_at',
  };
};

export default {
  buildLeadQueryPlan,
};
