import axios from 'axios';
import { getGoogleMapsConfig, validateGoogleMapsConfig } from '../../config/googleMaps.js';
import logger from '../../utils/logger.js';
import { mapGoogleMapsApiError } from '../../utils/externalApiErrorMapper.js';

const safeString = (value) => (typeof value === 'string' ? value.trim() : null);

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const SEARCH_TEXT_ENDPOINT = '/places:searchText';
const SEARCH_FIELD_MASK = [
  // Essentials tier
  'places.id',
  'places.formattedAddress',
  'places.addressComponents',  // ← Required to properly parse city / state / zip_code
  'places.types',
  // Pro tier
  'places.displayName',
  'places.businessStatus',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.pureServiceAreaBusiness',
  'places.googleMapsUri',
  'places.location',
  // Enterprise tier
  'places.internationalPhoneNumber',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
  'places.priceLevel',
  // Pagination
  'nextPageToken',
].join(',');

/**
 * Fallback parser: extract city, state, zip from a formatted US address string.
 * Works on addresses like "123 Main St, Austin, TX 78701, USA"
 * Parts: [street, city, "STATE ZIP", country]
 */
const parseAddressFromFormatted = (formattedAddress) => {
  if (!formattedAddress || typeof formattedAddress !== 'string') {
    return { city: null, state: null, zip_code: null };
  }
  const parts = formattedAddress.split(',').map((p) => p.trim());
  // Typical US: ["123 Main St", "Austin", "TX 78701", "USA"]
  const stateZipPart = parts.length >= 3 ? parts[parts.length - 2] : null;
  const cityPart = parts.length >= 3 ? parts[parts.length - 3] : null;

  let state = null;
  let zip_code = null;

  if (stateZipPart) {
    // Match "TX 78701" or "TX" or "78701" patterns
    const match = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (match) {
      state = match[1];
      zip_code = match[2];
    } else {
      // Check if pure state abbreviation (2 uppercase letters)
      const stateOnly = stateZipPart.match(/^([A-Z]{2})$/);
      if (stateOnly) state = stateOnly[1];
    }
  }

  return {
    city: cityPart || null,
    state,
    zip_code,
  };
};

export const parseGooglePlaceToLead = (place = {}) => {
  const location = place.location || place.geometry?.location || {};
  const addressParts = extractAddressParts(place.addressComponents || place.address_components || []);
  const businessName = safeString(place.displayName?.text || place.name);
  const externalPlaceId = safeString(place.id || place.place_id);
  const websiteUrl = safeString(place.websiteUri || place.website);

  // Fallback: parse city/state/zip from formattedAddress when addressComponents is missing
  const formattedFallback = parseAddressFromFormatted(place.formattedAddress);

  return {
    // --- Core fields (Essentials) ---
    business_name: businessName,
    address: safeString(place.formattedAddress || place.formatted_address || place.vicinity),
    city: safeString(addressParts.city) || formattedFallback.city,
    state: safeString(addressParts.state) || formattedFallback.state,
    zip_code: safeString(addressParts.zip_code) || formattedFallback.zip_code,
    latitude: Number.isFinite(location.latitude)
      ? Number(location.latitude)
      : (Number.isFinite(location.lat) ? Number(location.lat) : null),
    longitude: Number.isFinite(location.longitude)
      ? Number(location.longitude)
      : (Number.isFinite(location.lng) ? Number(location.lng) : null),
    external_place_id: externalPlaceId,
    // types: flat array of all place type slugs e.g. ["plumber", "home_goods_store"]
    types: Array.isArray(place.types) ? place.types : null,

    // --- Pro tier fields ---
    google_maps_uri: safeString(place.googleMapsUri),
    // Primary slug type for DB filtering (unchanged)
    business_category: safeString(place.primaryType || place.types?.[0]),
    // Human-readable primary type label, e.g. "Plumber"
    primary_type_display_name: safeString(
      place.primaryTypeDisplayName?.text || place.primaryTypeDisplayName || null,
    ),
    // OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
    business_status: safeString(place.businessStatus || place.business_status),
    // True when business serves customers at their location (no storefront)
    pure_service_area_business: Boolean(place.pureServiceAreaBusiness),

    // --- Enterprise tier fields ---
    // National format (no country code) — kept for backward compatibility
    phone: safeString(place.nationalPhoneNumber || place.formatted_phone_number),
    // International format with country code, e.g. "+1 512-555-1234"
    international_phone_number: safeString(
      place.internationalPhoneNumber || place.international_phone_number,
    ),
    website_url: websiteUrl,
    google_rating: Number.isFinite(place.rating) ? Number(place.rating) : null,
    review_count: Number.isFinite(place.userRatingCount)
      ? Number(place.userRatingCount)
      : (Number.isFinite(place.user_ratings_total) ? Number(place.user_ratings_total) : 0),
    // PRICE_LEVEL_FREE | PRICE_LEVEL_INEXPENSIVE | PRICE_LEVEL_MODERATE |
    // PRICE_LEVEL_EXPENSIVE | PRICE_LEVEL_VERY_EXPENSIVE
    price_level: safeString(place.priceLevel || place.price_level),
    // Structured opening hours JSON: { weekdayDescriptions: [...], periods: [...] }
    regular_opening_hours: place.regularOpeningHours || place.regular_opening_hours || null,

    source: 'google_maps',
    source_updated_at: new Date().toISOString(),
  };
};

const normalizeApiBaseUrl = (baseUrl = '') => baseUrl.replace(/\/+$/, '');

const getPlaceIdentifier = (place = {}) => safeString(place.id || place.place_id);

const fetchSearchTextPages = async ({
  query,
  mapsConfig,
  axiosClient,
  maxPages,
  maxResults,
  fieldMask,
}) => {
  const collectedPlaces = [];
  let pageToken;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const endpoint = `${normalizeApiBaseUrl(mapsConfig.placesApiBaseUrl)}${SEARCH_TEXT_ENDPOINT}`;
    const pageSize = Math.min(20, Math.max(1, maxResults - collectedPlaces.length));

    const response = await axiosClient.post(
      endpoint,
      {
        textQuery: query,
        pageSize,
        ...(pageToken ? { pageToken } : {}),
      },
      {
        timeout: mapsConfig.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': mapsConfig.apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
      },
    );

    const payload = response.data || {};
    const places = payload.places || [];
    collectedPlaces.push(...places);

    if (!payload.nextPageToken || collectedPlaces.length >= maxResults) {
      break;
    }

    pageToken = payload.nextPageToken;
    await delay(100);
  }

  return collectedPlaces.slice(0, maxResults);
};

export const fetchPlacesByText = async ({
  query,
  axiosClient = axios,
  maxPages = Number(process.env.GOOGLE_MAPS_MAX_PAGES || 3),
  maxResults = Number(process.env.GOOGLE_MAPS_MAX_RESULTS || 60),
}) => {
  const startedAt = Date.now();

  try {
    const configValidation = validateGoogleMapsConfig();
    if (!configValidation.isValid) {
      throw new Error(configValidation.message);
    }

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('query is required for Google Maps text search');
    }

    const mapsConfig = getGoogleMapsConfig();

    logger.info('Google Maps text search started', {
      query,
      provider: 'google_maps',
      maxPages,
      maxResults,
      strategy: 'single_pass_field_mask',
    });

    const searchResults = await fetchSearchTextPages({
      query,
      mapsConfig,
      axiosClient,
      maxPages,
      maxResults,
      fieldMask: SEARCH_FIELD_MASK,
    });

    const mappedResults = searchResults.map(parseGooglePlaceToLead);

    logger.info('Google Maps text search completed', {
      query,
      provider: 'google_maps',
      discoveredCount: searchResults.length,
      resultCount: mappedResults.length,
      durationMs: Date.now() - startedAt,
    });

    return mappedResults;
  } catch (error) {
    const mappedError = mapGoogleMapsApiError(error);

    logger.error('Google Maps text search failed', {
      query,
      provider: 'google_maps',
      errorCode: mappedError.code,
      message: mappedError.message,
      durationMs: Date.now() - startedAt,
    });

    throw mappedError;
  }
};

export default {
  parseGooglePlaceToLead,
  fetchPlacesByText,
};
