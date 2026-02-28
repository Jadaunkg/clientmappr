import { describe, test, expect } from '@jest/globals';
import { buildLeadsSearchCacheKey } from '../../src/utils/cacheKeys.js';

describe('buildLeadsSearchCacheKey', () => {
  test('builds deterministic key for identical filters regardless of key order', () => {
    const keyA = buildLeadsSearchCacheKey({
      page: 1,
      limit: 20,
      filters: {
        state: 'TX',
        city: 'Austin',
      },
    });

    const keyB = buildLeadsSearchCacheKey({
      page: 1,
      limit: 20,
      filters: {
        city: 'Austin',
        state: 'TX',
      },
    });

    expect(keyA).toEqual(keyB);
    expect(keyA.startsWith('leads:search:')).toBe(true);
  });

  test('includes pagination and sort dimension', () => {
    const key = buildLeadsSearchCacheKey({
      page: 3,
      limit: 20,
      sort: 'rating_desc',
      filters: { city: 'Dallas' },
    });

    expect(key).toContain('page:3');
    expect(key).toContain('limit:20');
    expect(key).toContain('sort:rating_desc');
  });
});
