import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Button, Input, FormLabel } from './FormComponents';

const defaultAdvancedFilters = {
    city: '',
    state: '',
    business_category: '',
    has_website: '',
    has_phone: '',
    business_status: '',
    min_rating: '',
    max_rating: '',
    price_level: '',
    sort_by: 'created_at',
    sort_order: 'desc',
};

const BUSINESS_STATUS_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'CLOSED_TEMPORARILY', label: 'Temporarily Closed' },
    { value: 'CLOSED_PERMANENTLY', label: 'Permanently Closed' },
];

const PRICE_LEVEL_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'PRICE_LEVEL_FREE', label: 'Free' },
    { value: 'PRICE_LEVEL_INEXPENSIVE', label: '$' },
    { value: 'PRICE_LEVEL_MODERATE', label: '$$' },
    { value: 'PRICE_LEVEL_EXPENSIVE', label: '$$$' },
    { value: 'PRICE_LEVEL_VERY_EXPENSIVE', label: '$$$$' },
];

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Date Added' },
    { value: 'business_name', label: 'Business Name' },
    { value: 'google_rating', label: 'Rating' },
    { value: 'review_count', label: 'Review Count' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
];

const YES_NO_ANY = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
];

function SelectField({ id, label, value, onChange, options }) {
    return (
        <div className="min-w-[130px]">
            <FormLabel htmlFor={id}>{label}</FormLabel>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

/**
 * Build dropdown options from a dynamic array of strings.
 * Prepends "All" / "Any" as the empty-value option.
 */
function buildDynamicOptions(items = [], emptyLabel = 'All') {
    return [
        { value: '', label: emptyLabel },
        ...items.map((item) => ({
            value: item,
            label: item.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        })),
    ];
}

function countActiveFilters(filters) {
    const skip = new Set(['sort_by', 'sort_order']);
    return Object.entries(filters).filter(
        ([key, val]) => !skip.has(key) && val !== '' && val !== undefined && val !== null
    ).length;
}

/**
 * AdvancedFilters — collapsible filter panel with dynamic dropdowns.
 *
 * @param {Object}   filterOptions  – { cities: [], states: [], categories: [] } from API
 * @param {Object}   filters        – current filter state
 * @param {Function} onChange        – setter for filter state
 * @param {Function} onApply        – apply filters callback
 * @param {Function} onClear        – clear all callback
 * @param {Boolean}  loading
 * @param {Number}   total          – total matching leads
 */
export function AdvancedFilters({ filters, onChange, onApply, onClear, loading, total, filterOptions = {} }) {
    const [expanded, setExpanded] = useState(false);
    const activeCount = countActiveFilters(filters);

    const cityOptions = buildDynamicOptions(filterOptions.cities, 'All Cities');
    const categoryOptions = buildDynamicOptions(filterOptions.categories, 'All Categories');

    const handleChange = (field, value) => {
        onChange({ ...filters, [field]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply();
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header row — always visible */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Advanced Filters
                    {activeCount > 0 && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                            {activeCount}
                        </span>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-600">
                        <strong>{total || 0}</strong> leads
                    </p>
                    {activeCount > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                            <X className="w-3.5 h-3.5" />
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible filter panel */}
            {expanded && (
                <form onSubmit={handleSubmit} className="border-t border-slate-100 px-4 py-4 space-y-4">
                    {/* Row 1: Location + Category (dynamic dropdowns) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <SelectField
                            id="af-city"
                            label="City"
                            value={filters.city}
                            onChange={(v) => handleChange('city', v)}
                            options={cityOptions}
                        />
                        <div>
                            <FormLabel htmlFor="af-state">State</FormLabel>
                            <Input
                                id="af-state"
                                value={filters.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                placeholder="TX"
                            />
                        </div>
                        <SelectField
                            id="af-category"
                            label="Category"
                            value={filters.business_category}
                            onChange={(v) => handleChange('business_category', v)}
                            options={categoryOptions}
                        />
                        <SelectField
                            id="af-biz-status"
                            label="Business Status"
                            value={filters.business_status}
                            onChange={(v) => handleChange('business_status', v)}
                            options={BUSINESS_STATUS_OPTIONS}
                        />
                    </div>

                    {/* Row 2: Boolean filters + Rating + Price */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <SelectField
                            id="af-website"
                            label="Has Website"
                            value={filters.has_website}
                            onChange={(v) => handleChange('has_website', v)}
                            options={YES_NO_ANY}
                        />
                        <SelectField
                            id="af-phone"
                            label="Has Phone"
                            value={filters.has_phone}
                            onChange={(v) => handleChange('has_phone', v)}
                            options={YES_NO_ANY}
                        />
                        <div>
                            <FormLabel htmlFor="af-min-rating">Min Rating</FormLabel>
                            <Input
                                id="af-min-rating"
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={filters.min_rating}
                                onChange={(e) => handleChange('min_rating', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <FormLabel htmlFor="af-max-rating">Max Rating</FormLabel>
                            <Input
                                id="af-max-rating"
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={filters.max_rating}
                                onChange={(e) => handleChange('max_rating', e.target.value)}
                                placeholder="5"
                            />
                        </div>
                        <SelectField
                            id="af-price"
                            label="Price Level"
                            value={filters.price_level}
                            onChange={(v) => handleChange('price_level', v)}
                            options={PRICE_LEVEL_OPTIONS}
                        />
                    </div>

                    {/* Row 3: Sort + Apply */}
                    <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
                        <SelectField
                            id="af-sort"
                            label="Sort By"
                            value={filters.sort_by}
                            onChange={(v) => handleChange('sort_by', v)}
                            options={SORT_OPTIONS}
                        />
                        <SelectField
                            id="af-order"
                            label="Order"
                            value={filters.sort_order}
                            onChange={(v) => handleChange('sort_order', v)}
                            options={[
                                { value: 'desc', label: 'Descending' },
                                { value: 'asc', label: 'Ascending' },
                            ]}
                        />
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="secondary" onClick={onClear}>Clear</Button>
                            <Button type="submit" loading={loading}>Apply Filters</Button>
                        </div>
                    </div>
                </form>
            )}
        </section>
    );
}

export { defaultAdvancedFilters };
export default AdvancedFilters;
