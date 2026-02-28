import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

/**
 * Generate a dynamic filename based on active filters.
 * Example: leads_plumber_austin_no-website_2026-02-28
 */
function buildExportFilename(filters) {
    const parts = ['leads'];

    if (filters.business_category) parts.push(filters.business_category.toLowerCase().replace(/\s+/g, '-'));
    if (filters.city) parts.push(filters.city.toLowerCase().replace(/\s+/g, '-'));
    if (filters.state) parts.push(filters.state.toUpperCase());
    if (filters.has_website === 'true') parts.push('with-website');
    if (filters.has_website === 'false') parts.push('no-website');
    if (filters.has_phone === 'true') parts.push('with-phone');
    if (filters.has_phone === 'false') parts.push('no-phone');
    if (filters.business_status === 'OPERATIONAL') parts.push('operational');
    if (filters.business_status === 'CLOSED_TEMPORARILY') parts.push('temp-closed');
    if (filters.business_status === 'CLOSED_PERMANENTLY') parts.push('perm-closed');
    if (filters.min_rating) parts.push(`${filters.min_rating}+stars`);
    if (filters.price_level) {
        const priceMap = {
            PRICE_LEVEL_FREE: 'free',
            PRICE_LEVEL_INEXPENSIVE: 'budget',
            PRICE_LEVEL_MODERATE: 'moderate',
            PRICE_LEVEL_EXPENSIVE: 'expensive',
            PRICE_LEVEL_VERY_EXPENSIVE: 'luxury',
        };
        parts.push(priceMap[filters.price_level] || '');
    }

    const date = new Date().toISOString().slice(0, 10);
    parts.push(date);

    return parts.filter(Boolean).join('_');
}

/**
 * Flatten a lead object into a clean row for export.
 */
function flattenLead(lead) {
    const formatHours = (hours) => {
        if (!hours?.weekdayDescriptions) return '';
        return hours.weekdayDescriptions.join(' | ');
    };

    return {
        'Business Name': lead.business_name || '',
        'Category': lead.business_category || '',
        'Primary Type': lead.primary_type_display_name || '',
        'Status': lead.status || '',
        'Business Status': lead.business_status || '',
        'Address': lead.address || '',
        'City': lead.city || '',
        'State': lead.state || '',
        'Zip Code': lead.zip_code || '',
        'Phone': lead.international_phone_number || lead.phone || '',
        'Website': lead.website_url || '',
        'Has Website': lead.has_website ? 'Yes' : 'No',
        'Rating': lead.google_rating ?? '',
        'Reviews': lead.review_count ?? '',
        'Price Level': lead.price_level || '',
        'Service Area Biz': lead.pure_service_area_business ? 'Yes' : 'No',
        'Google Maps': lead.google_maps_uri || '',
        'Opening Hours': formatHours(lead.regular_opening_hours),
        'Types': Array.isArray(lead.types) ? lead.types.join(', ') : '',
        'Created At': lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '',
    };
}

/**
 * Download a CSV string as a file.
 */
function downloadCSV(leads, filename) {
    const rows = leads.map(flattenLead);
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvLines = [
        headers.map((h) => `"${h}"`).join(','),
        ...rows.map((row) =>
            headers.map((h) => {
                const val = String(row[h] ?? '').replace(/"/g, '""');
                return `"${val}"`;
            }).join(',')
        ),
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Download an Excel file using SheetJS (dynamically loaded).
 */
async function downloadExcel(leads, filename) {
    const rows = leads.map(flattenLead);
    if (rows.length === 0) return;

    // Dynamic import — xlsx is loaded only when user exports to Excel
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map((key) => {
        const maxLen = Math.max(
            key.length,
            ...rows.map((r) => String(r[key] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function ExportDropdown({ filters, onFetchLeads, disabled }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingType, setLoadingType] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleExport = async (format) => {
        setLoading(true);
        setLoadingType(format);
        setOpen(false);

        try {
            const leads = await onFetchLeads();
            if (!leads || leads.length === 0) {
                alert('No leads to export with current filters.');
                return;
            }

            const filename = buildExportFilename(filters);

            if (format === 'csv') {
                downloadCSV(leads, filename);
            } else {
                await downloadExcel(leads, filename);
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        } finally {
            setLoading(false);
            setLoadingType(null);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled || loading}
                onClick={() => setOpen((v) => !v)}
                className={`
          inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium
          transition-colors
          ${loading
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-wait'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }
        `}
            >
                <Download className="w-4 h-4" />
                {loading ? `Exporting ${loadingType?.toUpperCase()}…` : 'Export'}
                {!loading && <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {open && !loading && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg border border-slate-200 bg-white shadow-lg z-20 py-1">
                    <button
                        type="button"
                        onClick={() => handleExport('csv')}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <FileText className="w-4 h-4 text-green-600" />
                        <div className="text-left">
                            <p className="font-medium">CSV</p>
                            <p className="text-xs text-slate-500">Comma-separated values</p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExport('excel')}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <div className="text-left">
                            <p className="font-medium">Excel (.xlsx)</p>
                            <p className="text-xs text-slate-500">Microsoft Excel workbook</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportDropdown;
