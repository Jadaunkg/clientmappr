const stableSerialize = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableSerialize(value[key])}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
};

export const buildLeadsSearchCacheKey = ({
  filters = {},
  page = 1,
  limit = 20,
  sort = 'created_at_desc',
} = {}) => {
  const serializedFilters = stableSerialize(filters);
  return `leads:search:page:${page}:limit:${limit}:sort:${sort}:filters:${serializedFilters}`;
};

export const LEADS_SEARCH_CACHE_TTL_SECONDS = Number(process.env.LEADS_SEARCH_CACHE_TTL_SECONDS || 300);
