import { describe, test, expect } from '@jest/globals';
import { parseGooglePlaceToLead } from '../../src/services/leads/googleMapsScraper.js';

describe('googleMapsScraper parser', () => {
  test('maps Places API v1 payload into lead shape', () => {
    const lead = parseGooglePlaceToLead({
      id: 'google-place-1',
      displayName: { text: 'Acme Plumbing' },
      formattedAddress: '123 Main St, Austin, TX',
      nationalPhoneNumber: '(512) 555-1212',
      websiteUri: 'https://acmeplumbing.com',
      primaryType: 'plumber',
      rating: 4.7,
      userRatingCount: 120,
      location: {
        latitude: 30.2672,
        longitude: -97.7431,
      },
    });

    expect(lead.business_name).toBe('Acme Plumbing');
    expect(lead.address).toContain('Austin');
    expect(lead.business_category).toBe('plumber');
    expect(lead.external_place_id).toBe('google-place-1');
    expect(lead.latitude).toBe(30.2672);
    expect(lead.longitude).toBe(-97.7431);
    expect(lead.source).toBe('google_maps');
  });

  test('uses safe defaults for optional fields', () => {
    const lead = parseGooglePlaceToLead({
      displayName: { text: 'Unknown Biz' },
      location: {},
    });

    expect(lead.google_rating).toBeNull();
    expect(lead.review_count).toBe(0);
    expect(lead.external_place_id).toBeNull();
  });
});
