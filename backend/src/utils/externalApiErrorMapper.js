import AppError from './AppError.js';

export const mapGoogleMapsApiError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
    return new AppError('Google Maps API timeout', 504, 'GOOGLE_MAPS_TIMEOUT');
  }

  if (error?.response?.status === 429) {
    return new AppError('Google Maps API quota exceeded', 429, 'GOOGLE_MAPS_QUOTA_EXCEEDED');
  }

  if (error?.response?.status === 403) {
    return new AppError('Google Maps API request denied', 502, 'GOOGLE_MAPS_REQUEST_DENIED');
  }

  if (error?.response?.status >= 500) {
    return new AppError('Google Maps API upstream error', 502, 'GOOGLE_MAPS_UPSTREAM_ERROR');
  }

  const errorMessage = String(error?.message || '');

  if (errorMessage.includes('OVER_QUERY_LIMIT')) {
    return new AppError('Google Maps API quota exceeded', 429, 'GOOGLE_MAPS_QUOTA_EXCEEDED');
  }

  if (errorMessage.includes('REQUEST_DENIED')) {
    return new AppError('Google Maps API request denied', 502, 'GOOGLE_MAPS_REQUEST_DENIED');
  }

  if (errorMessage.includes('ZERO_RESULTS')) {
    return new AppError('No enrichment results found from Google Maps', 404, 'GOOGLE_MAPS_NO_RESULTS');
  }

  return new AppError('Google Maps integration failed', 502, 'GOOGLE_MAPS_API_ERROR');
};

export default {
  mapGoogleMapsApiError,
};
