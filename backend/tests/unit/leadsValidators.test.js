import { describe, test, expect } from '@jest/globals';
import { parseLeadListInput } from '../../src/validators/leadsValidators.js';

describe('parseLeadListInput', () => {
  test('applies default pagination values', () => {
    const parsed = parseLeadListInput({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe('created_at');
    expect(parsed.sortOrder).toBe('desc');
  });

  test('parses filters and boolean query params', () => {
    const parsed = parseLeadListInput({
      city: 'Austin',
      has_website: 'true',
      min_rating: '3.5',
      max_rating: '4.8',
      page: '2',
      limit: '20',
      sort_by: 'google_rating',
      sort_order: 'asc',
    });

    expect(parsed.filters.city).toBe('Austin');
    expect(parsed.filters.has_website).toBe(true);
    expect(parsed.filters.min_rating).toBe(3.5);
    expect(parsed.filters.max_rating).toBe(4.8);
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe('google_rating');
    expect(parsed.sortOrder).toBe('asc');
  });

  test('throws on invalid rating ranges', () => {
    expect(() => parseLeadListInput({ min_rating: 5, max_rating: 2 })).toThrow(
      'min_rating cannot be greater than max_rating',
    );
  });
});
