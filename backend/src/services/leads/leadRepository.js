import { createClient } from '@supabase/supabase-js';
import logger from '../../utils/logger.js';

const getSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase is not configured');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

export const upsertLeads = async (leads = []) => {
  if (!Array.isArray(leads) || leads.length === 0) {
    return {
      persistedCount: 0,
      rows: [],
    };
  }

  const supabase = getSupabaseClient();
  const payload = leads.map((lead) => ({
    business_name: lead.business_name,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    zip_code: lead.zip_code,
    phone: lead.phone,
    website_url: lead.website_url,
    has_website: Boolean(lead.website_url),
    business_category: lead.business_category,
    latitude: lead.latitude,
    longitude: lead.longitude,
    status: lead.status || 'validated',
    source: lead.source || 'google_maps',
    external_place_id: lead.external_place_id,
    // Essentials tier
    google_maps_uri: lead.google_maps_uri || null,
    types: Array.isArray(lead.types) ? lead.types : null,
    // Pro tier
    business_status: lead.business_status || null,
    primary_type_display_name: lead.primary_type_display_name || null,
    pure_service_area_business: Boolean(lead.pure_service_area_business),
    // Enterprise tier
    international_phone_number: lead.international_phone_number || null,
    price_level: lead.price_level || null,
    regular_opening_hours: lead.regular_opening_hours || null,
    // Rating (from initial schema, missing from live DB until migration 007)
    google_rating: lead.google_rating != null ? Number(lead.google_rating) : null,
    review_count: lead.review_count != null ? Number(lead.review_count) : 0,
    // Freshness tracking
    source_updated_at: lead.source_updated_at,
    last_synced_at: lead.last_synced_at,
    freshness_score: lead.freshness_score,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('leads')
    .upsert(payload, { onConflict: 'source,external_place_id' })
    .select();

  if (error) {
    logger.error('Failed to upsert leads', { message: error.message });
    throw new Error(`Failed to persist leads: ${error.message}`);
  }

  return {
    persistedCount: data?.length || 0,
    rows: data || [],
  };
};

export default {
  upsertLeads,
};
