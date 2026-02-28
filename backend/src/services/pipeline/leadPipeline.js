const requiredLeadFields = ['business_name', 'address'];

const PHONE_DIGITS_MIN = 10;

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizePhone = (phone) => {
  const normalized = normalizeOptionalString(phone);
  if (!normalized) {
    return null;
  }

  const stripped = normalized.replace(/[^\d+]/g, '');
  return stripped.length > 0 ? stripped : null;
};

const normalizeWebsite = (url) => {
  const normalized = normalizeOptionalString(url);
  if (!normalized) {
    return null;
  }

  return normalized.startsWith('http://') || normalized.startsWith('https://')
    ? normalized
    : `https://${normalized}`;
};

const calculateFreshnessScore = (sourceUpdatedAt) => {
  const sourceDate = sourceUpdatedAt ? new Date(sourceUpdatedAt) : new Date();
  const ageInDays = Math.max((Date.now() - sourceDate.getTime()) / (1000 * 60 * 60 * 24), 0);
  const score = 100 - ageInDays * 2;
  return Math.max(Math.min(Number(score.toFixed(2)), 100), 0);
};

export const normalizeLeadRecord = (rawLead = {}) => {
  return {
    // Core fields
    business_name: normalizeOptionalString(rawLead.business_name || rawLead.name) || '',
    address: normalizeOptionalString(rawLead.address),
    city: normalizeOptionalString(rawLead.city),
    state: normalizeOptionalString(rawLead.state),
    zip_code: normalizeOptionalString(rawLead.zip_code),
    phone: normalizePhone(rawLead.phone),
    website_url: normalizeWebsite(rawLead.website_url),
    has_website: Boolean(rawLead.website_url),
    business_category: normalizeOptionalString(rawLead.business_category),
    google_rating: rawLead.google_rating ? Number(rawLead.google_rating) : null,
    review_count: rawLead.review_count ? Number(rawLead.review_count) : 0,
    latitude: rawLead.latitude ? Number(rawLead.latitude) : null,
    longitude: rawLead.longitude ? Number(rawLead.longitude) : null,
    source: rawLead.source || 'google_maps',
    external_place_id: normalizeOptionalString(rawLead.external_place_id),
    source_updated_at: rawLead.source_updated_at || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    freshness_score: rawLead.freshness_score
      ? Number(rawLead.freshness_score)
      : calculateFreshnessScore(rawLead.source_updated_at),

    // New: Essentials tier
    google_maps_uri: normalizeOptionalString(rawLead.google_maps_uri),
    types: Array.isArray(rawLead.types) ? rawLead.types : null,

    // New: Pro tier
    business_status: normalizeOptionalString(rawLead.business_status),
    primary_type_display_name: normalizeOptionalString(rawLead.primary_type_display_name),
    pure_service_area_business: rawLead.pure_service_area_business != null
      ? Boolean(rawLead.pure_service_area_business)
      : false,

    // New: Enterprise tier
    international_phone_number: normalizeOptionalString(rawLead.international_phone_number),
    price_level: normalizeOptionalString(rawLead.price_level),
    regular_opening_hours: rawLead.regular_opening_hours || null,

    // Rating fields (missing from live DB pre-migration-007)
    google_rating: rawLead.google_rating != null ? Number(rawLead.google_rating) : null,
    review_count: rawLead.review_count != null ? Number(rawLead.review_count) : 0,
  };
};

export const deriveLeadMetadata = (lead) => {
  const websiteHost = lead.website_url
    ? lead.website_url.replace(/^https?:\/\//, '').split('/')[0]
    : null;

  return {
    website_host: websiteHost,
    has_contact_channel: Boolean(lead.phone || lead.website_url),
    quality_score: Number((
      (lead.business_name ? 30 : 0)
      + (lead.address ? 20 : 0)
      + (lead.phone ? 20 : 0)
      + (lead.website_url ? 20 : 0)
      + (lead.google_rating ? 10 : 0)
    ).toFixed(2)),
  };
};

export const cleanLeadRecord = (lead) => {
  const cleaned = {
    ...lead,
    business_name: normalizeOptionalString(lead.business_name),
    address: normalizeOptionalString(lead.address),
    city: normalizeOptionalString(lead.city),
    state: normalizeOptionalString(lead.state),
    zip_code: normalizeOptionalString(lead.zip_code),
    phone: normalizePhone(lead.phone),
    website_url: normalizeWebsite(lead.website_url),
    external_place_id: normalizeOptionalString(lead.external_place_id),
    // New fields — pass-through with light normalization
    google_maps_uri: normalizeOptionalString(lead.google_maps_uri),
    types: Array.isArray(lead.types) ? lead.types : null,
    business_status: normalizeOptionalString(lead.business_status),
    primary_type_display_name: normalizeOptionalString(lead.primary_type_display_name),
    pure_service_area_business: Boolean(lead.pure_service_area_business),
    international_phone_number: normalizeOptionalString(lead.international_phone_number),
    price_level: normalizeOptionalString(lead.price_level),
    regular_opening_hours: lead.regular_opening_hours || null,
    // Rating fields
    google_rating: lead.google_rating != null ? Number(lead.google_rating) : null,
    review_count: lead.review_count != null ? Number(lead.review_count) : 0,
  };

  const isSocialMediaUrl = (url) => {
    if (!url) return false;
    const domains = [
      'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com',
      'tiktok.com', 'yelp.com', 'yellowpages.com', 'linktr.ee', 'pinterest.com',
      'youtube.com', 'foursquare.com', 'bbb.org'
    ];
    try {
      const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      return domains.some(d => hostname === d || hostname.endsWith(`.${d}`));
    } catch {
      return false;
    }
  };

  cleaned.has_website = Boolean(cleaned.website_url) && !isSocialMediaUrl(cleaned.website_url);
  return cleaned;
};

export const deduplicateLeadBatch = (leads = []) => {
  const seen = new Set();
  const deduped = [];

  leads.forEach((lead) => {
    const dedupeKey = lead.external_place_id
      || `${String(lead.business_name || '').toLowerCase()}|${String(lead.address || '').toLowerCase()}`;

    if (!dedupeKey || seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    deduped.push(lead);
  });

  return deduped;
};

export const enrichLeadRecord = (lead, enrichment = {}) => {
  return {
    ...lead,
    ...enrichment,
    last_synced_at: enrichment.last_synced_at || new Date().toISOString(),
    source_updated_at: enrichment.source_updated_at || lead.source_updated_at || new Date().toISOString(),
    freshness_score: enrichment.freshness_score
      ? Number(enrichment.freshness_score)
      : calculateFreshnessScore(enrichment.source_updated_at || lead.source_updated_at),
    status: enrichment.status || lead.status || 'validated',
  };
};

export const validateLeadRecord = (lead) => {
  const errors = [];

  requiredLeadFields.forEach((field) => {
    if (!lead[field]) {
      errors.push(`${field} is required`);
    }
  });

  if (lead.google_rating !== null && (lead.google_rating < 0 || lead.google_rating > 5)) {
    errors.push('google_rating must be between 0 and 5');
  }

  if (lead.phone) {
    const phoneDigits = lead.phone.replace(/\D/g, '');
    if (phoneDigits.length < PHONE_DIGITS_MIN) {
      errors.push('phone must contain at least 10 digits');
    }
  }

  if (lead.website_url) {
    const websitePattern = /^https?:\/\/.+/i;
    if (!websitePattern.test(lead.website_url)) {
      errors.push('website_url must be a valid URL');
    }
  }

  if (lead.contact_email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(lead.contact_email)) {
      errors.push('contact_email is invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const buildIngestBatch = (rawRecords = []) => {
  return rawRecords.map((record) => {
    const normalized = normalizeLeadRecord(record);
    const validation = validateLeadRecord(normalized);

    return {
      normalized,
      validation,
    };
  });
};

export default {
  normalizeLeadRecord,
  deriveLeadMetadata,
  cleanLeadRecord,
  deduplicateLeadBatch,
  enrichLeadRecord,
  validateLeadRecord,
  buildIngestBatch,
};
