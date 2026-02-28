import React from 'react';
import { Button } from './FormComponents';
import {
  MapPin,
  Phone,
  Globe,
  Star,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
  List,
} from 'lucide-react';

/**
 * Convert Places API priceLevel enum to dollar-sign display.
 */
const formatPriceLevel = (priceLevel) => {
  const map = {
    PRICE_LEVEL_FREE: 'Free',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  };
  return map[priceLevel] || priceLevel || null;
};

/**
 * Render status icon + label for business_status field.
 */
const statusConfig = {
  OPERATIONAL: { icon: CheckCircle, label: 'Operational', color: 'text-green-600' },
  CLOSED_TEMPORARILY: { icon: Clock, label: 'Temporarily Closed', color: 'text-amber-600' },
  CLOSED_PERMANENTLY: { icon: AlertCircle, label: 'Permanently Closed', color: 'text-red-600' },
};

const StatusRow = ({ status }) => {
  if (!status) return null;
  const cfg = statusConfig[status] || { label: status, color: 'text-slate-500' };
  const Icon = cfg.icon;
  return (
    <DetailField
      label="Business Status"
      value={
        <span className={`inline-flex items-center gap-1.5 font-semibold ${cfg.color}`}>
          {Icon && <Icon className="w-4 h-4" />}
          {cfg.label}
        </span>
      }
    />
  );
};

/**
 * Format regularOpeningHours JSONB into readable lines.
 */
const OpeningHours = ({ hours }) => {
  if (!hours) return null;
  const days = hours.weekdayDescriptions || hours.weekday_text;
  if (!Array.isArray(days) || days.length === 0) return null;

  return (
    <div className="col-span-1 sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Opening Hours</p>
      <ul className="space-y-0.5">
        {days.map((day) => (
          <li key={day} className="text-sm text-slate-700 font-medium">{day}</li>
        ))}
      </ul>
    </div>
  );
};

export function LeadDetailModal({ lead, open, onClose }) {
  if (!open || !lead) return null;

  const priceDisplay = formatPriceLevel(lead.price_level);
  const mapsUrl = lead.google_maps_uri
    || (lead.external_place_id ? `https://www.google.com/maps/place/?q=place_id:${lead.external_place_id}` : null);

  const displayPhone = lead.international_phone_number || lead.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">{lead.business_name}</h2>
            {lead.primary_type_display_name && (
              <p className="mt-0.5 text-sm font-medium text-blue-600">{lead.primary_type_display_name}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">{lead.address || 'No address available'}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Main detail grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* --- PRO TIER --- */}
          <StatusRow status={lead.business_status} />

          {lead.pure_service_area_business && (
            <DetailField
              label="Service Area Business"
              value={
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-4 h-4 text-slate-500" />
                  Serves customers at their location
                </span>
              }
            />
          )}

          {/* --- ESSENTIALS TIER --- */}
          <DetailField label="Category (Slug)" value={lead.business_category || 'N/A'} />
          <DetailField label="Status" value={lead.status || 'new'} />

          {/* --- ENTERPRISE TIER --- */}
          <DetailField
            label="Phone (International)"
            value={
              displayPhone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {displayPhone}
                </span>
              ) : 'N/A'
            }
          />

          <DetailField
            label="Website"
            value={
              lead.website_url ? (
                <div className="flex items-center gap-2">
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline truncate"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    {lead.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                  {!lead.has_website && (
                    <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-medium text-blue-700">
                      Social / Directory
                    </span>
                  )}
                </div>
              ) : 'N/A'
            }
          />

          <DetailField
            label="Rating"
            value={
              lead.google_rating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {lead.google_rating}
                  {lead.review_count > 0 && (
                    <span className="text-slate-500 text-xs">({lead.review_count.toLocaleString()} reviews)</span>
                  )}
                </span>
              ) : 'N/A'
            }
          />

          <DetailField
            label="Price Level"
            value={
              priceDisplay ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                  {priceDisplay}
                </span>
              ) : 'N/A'
            }
          />

          {/* Location */}
          <DetailField label="City" value={lead.city || 'N/A'} />
          <DetailField label="State" value={lead.state || 'N/A'} />

          {/* Types array */}
          {Array.isArray(lead.types) && lead.types.length > 0 && (
            <div className="col-span-1 sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                <span className="inline-flex items-center gap-1"><List className="w-3.5 h-3.5" /> Place Types</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lead.types.map((t) => (
                  <span key={t} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-medium">
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opening Hours */}
          <OpeningHours hours={lead.regular_opening_hours} />

          {/* Google Maps link */}
          {mapsUrl && (
            <div className="col-span-1 sm:col-span-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                <MapPin className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-800 break-all">
        {typeof value === 'string' ? value : value}
      </div>
    </div>
  );
}

export default LeadDetailModal;
