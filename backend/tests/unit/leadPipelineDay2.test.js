import { describe, test, expect } from '@jest/globals';
import {
  normalizeLeadRecord,
  cleanLeadRecord,
  validateLeadRecord,
  deduplicateLeadBatch,
  deriveLeadMetadata,
  enrichLeadRecord,
} from '../../src/services/pipeline/leadPipeline.js';

describe('leadPipeline Day 2 quality rules', () => {
  test('normalizes and cleans phone/website fields', () => {
    const normalized = normalizeLeadRecord({
      business_name: '  Acme  ',
      address: ' 123 Main St ',
      phone: '(512) 555-1212',
      website_url: 'acme.com',
      external_place_id: 'pid-1',
    });

    const cleaned = cleanLeadRecord(normalized);

    expect(cleaned.business_name).toBe('Acme');
    expect(cleaned.phone).toBe('5125551212');
    expect(cleaned.website_url).toBe('https://acme.com');
    expect(cleaned.has_website).toBe(true);
  });

  test('rejects malformed phone and missing required fields', () => {
    const validation = validateLeadRecord({
      business_name: 'Acme',
      address: null,
      phone: '123',
      google_rating: 3,
      website_url: null,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      'address is required',
      'phone must contain at least 10 digits',
    ]));
  });

  test('deduplicates by external_place_id and fallback business/address key', () => {
    const deduped = deduplicateLeadBatch([
      { business_name: 'A', address: '1', external_place_id: 'p1' },
      { business_name: 'A', address: '1', external_place_id: 'p1' },
      { business_name: 'B', address: '2' },
      { business_name: 'B', address: '2' },
    ]);

    expect(deduped).toHaveLength(2);
  });

  test('derives metadata and applies enrichment freshness fields', () => {
    const lead = {
      business_name: 'Acme',
      address: '123 Main',
      phone: '5125551212',
      website_url: 'https://acme.com',
      source_updated_at: new Date().toISOString(),
    };

    const metadata = deriveLeadMetadata(lead);
    const enriched = enrichLeadRecord(lead, {
      ...metadata,
      status: 'enriched',
    });

    expect(metadata.website_host).toBe('acme.com');
    expect(metadata.quality_score).toBeGreaterThan(0);
    expect(enriched.status).toBe('enriched');
    expect(typeof enriched.freshness_score).toBe('number');
    expect(enriched.last_synced_at).toBeDefined();
  });
});
