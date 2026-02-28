import { describe, test, expect, jest } from '@jest/globals';
import { runLeadIngestionFlow } from '../../src/services/pipeline/leadIngestionFlow.js';

describe('Lead ingestion flow integration (mocked provider)', () => {
  test('processes fetch -> clean -> enrich -> persist with quality filtering', async () => {
    const mockUpsertLeads = jest.fn(async (leads) => ({
      persistedCount: leads.length,
      rows: leads,
    }));

    const dependencies = {
      scraper: {
        fetchPlacesByText: jest.fn(async () => ([
          {
            business_name: 'Acme Plumbing',
            address: '123 Main St, Austin, TX',
            phone: '(512) 555-1212',
            website_url: 'acmeplumbing.com',
            business_category: 'plumber',
            google_rating: 4.6,
            review_count: 90,
            external_place_id: 'p1',
            source: 'google_maps',
          },
          {
            business_name: 'Acme Plumbing',
            address: '123 Main St, Austin, TX',
            phone: '(512) 555-1212',
            website_url: 'acmeplumbing.com',
            business_category: 'plumber',
            google_rating: 4.6,
            review_count: 90,
            external_place_id: 'p1',
            source: 'google_maps',
          },
          {
            business_name: 'Bad Lead',
            address: null,
            phone: '123',
            external_place_id: 'p2',
            source: 'google_maps',
          },
        ])),
      },
      repository: {
        upsertLeads: mockUpsertLeads,
      },
    };

    const result = await runLeadIngestionFlow({ query: 'plumbers in Austin' }, dependencies);

    expect(result.qualityMeta.inputCount).toBe(3);
    expect(result.qualityMeta.dedupedCount).toBe(2);
    expect(result.qualityMeta.validCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(result.persistedCount).toBe(1);

    expect(mockUpsertLeads).toHaveBeenCalledTimes(1);
    expect(mockUpsertLeads.mock.calls[0][0][0]).toMatchObject({
      status: 'enriched',
      source: 'google_maps',
    });
  });
});
