const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const isGoogleMapsConfigured = () => Boolean(GOOGLE_MAPS_API_KEY);

export const getGoogleMapsConfig = () => ({
  apiKey: GOOGLE_MAPS_API_KEY,
  timeoutMs: Number(process.env.GOOGLE_MAPS_TIMEOUT_MS || 8000),
  placesApiBaseUrl: process.env.GOOGLE_MAPS_PLACES_API_BASE_URL || 'https://places.googleapis.com/v1',
});

export const validateGoogleMapsConfig = () => {
  if (!isGoogleMapsConfigured()) {
    return {
      isValid: false,
      message: 'GOOGLE_MAPS_API_KEY is not configured',
    };
  }

  if (GOOGLE_MAPS_API_KEY.length < 30) {
    return {
      isValid: false,
      message: 'GOOGLE_MAPS_API_KEY appears invalid (too short)',
    };
  }

  return {
    isValid: true,
    message: 'Google Maps credentials are configured',
  };
};
