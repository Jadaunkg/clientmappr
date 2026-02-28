import { describe, test, expect } from '@jest/globals';
import { mapGoogleMapsApiError } from '../../src/utils/externalApiErrorMapper.js';

describe('mapGoogleMapsApiError', () => {
  test('maps timeout errors to 504', () => {
    const mapped = mapGoogleMapsApiError({ code: 'ECONNABORTED', message: 'timeout exceeded' });
    expect(mapped.statusCode).toBe(504);
    expect(mapped.code).toBe('GOOGLE_MAPS_TIMEOUT');
  });

  test('maps quota limit errors to 429', () => {
    const mapped = mapGoogleMapsApiError({ message: 'Google Maps API request failed with status: OVER_QUERY_LIMIT' });
    expect(mapped.statusCode).toBe(429);
    expect(mapped.code).toBe('GOOGLE_MAPS_QUOTA_EXCEEDED');
  });

  test('maps unknown external failures to 502', () => {
    const mapped = mapGoogleMapsApiError(new Error('Something unexpected'));
    expect(mapped.statusCode).toBe(502);
    expect(mapped.code).toBe('GOOGLE_MAPS_API_ERROR');
  });
});
