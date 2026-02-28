import { describe, test, expect } from '@jest/globals';
import { buildLeadQueryPlan } from '../../src/services/leads/queryBuilder.js';

describe('buildLeadQueryPlan', () => {
  test('builds default pagination and empty filters', () => {
    const plan = buildLeadQueryPlan();

    expect(plan.pagination).toEqual({
      page: 1,
      limit: 20,
      offset: 0,
    });
    expect(plan.filters).toEqual({});
    expect(plan.indexedFilters).toEqual([]);
  });

  test('keeps only allowed filters and maps indexed filters', () => {
    const plan = buildLeadQueryPlan({
      city: 'Austin',
      state: 'TX',
      business_category: 'plumbing',
      unknown: 'ignore-this',
    }, {
      page: 2,
      limit: 20,
    });

    expect(plan.filters).toEqual({
      city: 'Austin',
      state: 'TX',
      business_category: 'plumbing',
    });

    expect(plan.indexedFilters).toEqual(expect.arrayContaining([
      'idx_leads_city',
      'idx_leads_state',
      'idx_leads_category',
    ]));
    expect(plan.pagination.offset).toBe(20);
  });

  test('guards pagination boundaries', () => {
    const plan = buildLeadQueryPlan({}, { page: 0, limit: 500 });

    expect(plan.pagination.page).toBe(1);
    expect(plan.pagination.limit).toBe(100);
    expect(plan.pagination.offset).toBe(0);
  });
});
