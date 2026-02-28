import React, { memo } from 'react';
import { MapPin, Globe, PhoneCall, Star, DollarSign, Truck, AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * Format a phone number with country code prefix if missing.
 * Prefers international_phone_number (already has country code).
 * Falls back to national phone with +1 prepend for US numbers.
 */
const formatPhone = (lead) => {
  // Prefer international number (e.g. "+1 512-555-1234")
  if (lead.international_phone_number) return lead.international_phone_number.trim();

  const phone = lead.phone;
  if (!phone) return null;
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) return cleaned;
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) return `+1 ${cleaned}`;
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return cleaned;
};

/**
 * Build a Google Maps URL.
 * Priority: stored google_maps_uri → place ID deep-link → coordinates → text search fallback
 */
const buildMapsUrl = (lead) => {
  if (lead.google_maps_uri) return lead.google_maps_uri;
  if (lead.external_place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${lead.external_place_id}`;
  }
  if (lead.latitude && lead.longitude) {
    return `https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`;
  }
  const query = [lead.business_name, lead.address, lead.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
};

/**
 * Convert Places API priceLevel enum to dollar-sign display.
 * e.g. PRICE_LEVEL_MODERATE → "$$"
 */
const formatPriceLevel = (priceLevel) => {
  const map = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  };
  return map[priceLevel] || null;
};

/**
 * Business status badge — colored pill.
 */
const BusinessStatusBadge = ({ status }) => {
  if (!status) return null;
  if (status === 'OPERATIONAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        <CheckCircle className="w-3 h-3" />
        Open
      </span>
    );
  }
  if (status === 'CLOSED_PERMANENTLY') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        <AlertCircle className="w-3 h-3" />
        Closed Permanently
      </span>
    );
  }
  if (status === 'CLOSED_TEMPORARILY') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        <Clock className="w-3 h-3" />
        Temporarily Closed
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{status}</span>
  );
};

const WebsiteBadge = ({ lead }) => {
  if (lead.has_website) {
    return <span className="rounded bg-green-50 px-2 py-1 text-green-700">Has Website</span>;
  }

  if (!lead.has_website && lead.website_url) {
    let platform = 'Social';
    try {
      const hostname = new URL(lead.website_url).hostname.replace('www.', '').toLowerCase();
      if (hostname.includes('facebook')) platform = 'Facebook';
      else if (hostname.includes('instagram')) platform = 'Instagram';
      else if (hostname.includes('linkedin')) platform = 'LinkedIn';
      else if (hostname.includes('twitter') || hostname.includes('x.com')) platform = 'Twitter';
      else if (hostname.includes('tiktok')) platform = 'TikTok';
      else if (hostname.includes('yelp')) platform = 'Yelp';
      else if (hostname.includes('linktr.ee')) platform = 'Linktree';
      else platform = 'Directory';
    } catch { }

    return (
      <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 font-medium">
        {platform} Only
      </span>
    );
  }

  return (
    <span className="rounded bg-orange-50 px-2 py-1 text-orange-700 font-medium">No Website ★</span>
  );
};

export const LeadCard = memo(function LeadCard({ lead, viewMode = 'grid', onViewDetails }) {
  const isGrid = viewMode === 'grid';
  const formattedPhone = formatPhone(lead);
  const mapsUrl = buildMapsUrl(lead);
  const priceDisplay = formatPriceLevel(lead.price_level);

  const handleMapsClick = (e) => {
    e.stopPropagation();
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWebsiteClick = (e) => {
    e.stopPropagation();
    if (lead.website_url) {
      window.open(lead.website_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      type="button"
      onClick={() => onViewDetails?.(lead)}
      className={`
        w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm
        transition-all hover:border-slate-300 hover:shadow-md
        ${isGrid ? 'h-full flex flex-col' : ''}
      `}
    >
      {/* Header row: name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2 flex-1">
          {lead.business_name}
        </h3>
        <BusinessStatusBadge status={lead.business_status} />
      </div>

      {/* Primary type display name (human-readable) */}
      {lead.primary_type_display_name && (
        <p className="mt-0.5 text-xs font-medium text-blue-600 uppercase tracking-wide">
          {lead.primary_type_display_name}
        </p>
      )}

      {/* Address */}
      <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">
        {lead.address || 'No address available'}
      </p>

      {/* Service Area Business indicator */}
      {lead.pure_service_area_business && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
          <Truck className="w-3.5 h-3.5 text-slate-400" />
          Service-area business
        </p>
      )}

      {/* Phone */}
      {formattedPhone && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
          <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
          {formattedPhone}
        </p>
      )}

      {/* Website */}
      {lead.website_url && (
        <span
          role="button"
          tabIndex={0}
          onClick={handleWebsiteClick}
          onKeyDown={(e) => e.key === 'Enter' && handleWebsiteClick(e)}
          className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline truncate"
        >
          <Globe className="w-3 h-3 shrink-0" />
          {lead.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </span>
      )}

      {/* Rating + review count + price */}
      {(lead.google_rating || lead.review_count > 0 || priceDisplay) && (
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
          {lead.google_rating && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <strong>{lead.google_rating}</strong>
              {lead.review_count > 0 && (
                <span className="text-slate-400 ml-0.5">({lead.review_count.toLocaleString()})</span>
              )}
            </span>
          )}
          {priceDisplay && (
            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700">
              <DollarSign className="w-3 h-3" />
              {priceDisplay}
            </span>
          )}
        </div>
      )}

      {/* Tags row */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {lead.business_category && (
          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{lead.business_category}</span>
        )}
        {lead.city && (
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{lead.city}</span>
        )}
        <WebsiteBadge lead={lead} />
      </div>

      {/* Maps link button */}
      <div className={`mt-3 ${isGrid ? 'mt-auto pt-3 border-t border-slate-100' : ''}`}>
        <span
          role="button"
          tabIndex={0}
          onClick={handleMapsClick}
          onKeyDown={(e) => e.key === 'Enter' && handleMapsClick(e)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          <MapPin className="w-3.5 h-3.5" />
          Open in Google Maps
        </span>
      </div>
    </button>
  );
});

export default LeadCard;
