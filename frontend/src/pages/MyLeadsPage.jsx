import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/FormComponents';
import ResultsList from '../components/ResultsList';
import LeadDetailModal from '../components/LeadDetailModal';
import PaginationControls from '../components/PaginationControls';
import { AdvancedFilters, defaultAdvancedFilters } from '../components/AdvancedFilters';
import { ExportDropdown } from '../components/ExportDropdown';
import { searchMyLeads, exportMyLeads, getMyFilterOptions } from '../services/leadsService';

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

/**
 * Map the advanced filter state into the API payload shape.
 * Empty strings are omitted so the backend treats them as "any".
 */
const mapFiltersToPayload = (filters) => {
  const payload = {};

  if (filters.city) payload.city = filters.city;
  if (filters.state) payload.state = filters.state;
  if (filters.business_category) payload.business_category = filters.business_category;
  if (filters.business_status) payload.business_status = filters.business_status;
  if (filters.price_level) payload.price_level = filters.price_level;

  if (filters.has_website !== '') payload.has_website = filters.has_website === 'true';
  if (filters.has_phone !== '') payload.has_phone = filters.has_phone === 'true';

  if (filters.min_rating !== '') payload.min_rating = Number(filters.min_rating);
  if (filters.max_rating !== '') payload.max_rating = Number(filters.max_rating);

  payload.sort_by = filters.sort_by || 'created_at';
  payload.sort_order = filters.sort_order || 'desc';

  return payload;
};

function MyLeadsPage() {
  const [filters, setFilters] = useState(defaultAdvancedFilters);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState(defaultPagination);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isTransitionPending, startTransition] = useTransition();
  const [filterOptions, setFilterOptions] = useState({ cities: [], states: [], categories: [] });

  const executeSearch = useCallback(async (searchFilters, page = 1) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...mapFiltersToPayload(searchFilters),
        page,
        limit: 20,
      };

      const response = await searchMyLeads(payload);
      startTransition(() => {
        setLeads(response.leads);
        setPagination(response.pagination || defaultPagination);
      });
    } catch (apiError) {
      const message = apiError?.response?.data?.error?.message || 'Failed to load leads. Please try again.';
      setError(message);
      setLeads([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    executeSearch(defaultAdvancedFilters, 1);
    // Fetch dynamic filter options (distinct cities, states, categories)
    getMyFilterOptions()
      .then(setFilterOptions)
      .catch(() => { }); // Silently fail — dropdowns just stay empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    executeSearch(filters, 1);
  };

  const handleClear = () => {
    setFilters(defaultAdvancedFilters);
    executeSearch(defaultAdvancedFilters, 1);
  };

  const handlePageChange = (nextPage) => {
    executeSearch(filters, nextPage);
  };

  /**
   * Called by ExportDropdown — fetches ALL matching leads (no pagination).
   */
  const handleFetchForExport = async () => {
    const payload = mapFiltersToPayload(filters);
    return exportMyLeads(payload);
  };

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse, filter, and export all your discovered leads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown
              filters={filters}
              onFetchLeads={handleFetchForExport}
              disabled={loading || pagination.total === 0}
            />

            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${viewMode === 'grid'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${viewMode === 'list'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                List
              </button>
            </div>
          </div>
        </header>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApply}
          onClear={handleClear}
          loading={loading}
          total={pagination.total}
          filterOptions={filterOptions}
        />

        {/* Results */}
        <section className="mt-5 space-y-4">
          <ResultsList
            leads={leads}
            loading={loading || isTransitionPending}
            error={error}
            viewMode={viewMode}
            onSelectLead={setSelectedLead}
            emptyState={(
              <div className="space-y-3">
                <p>No leads match your current filters.</p>
                <p className="text-sm text-slate-500">Try adjusting your filters or run a new discovery search.</p>
                <Link
                  to="/search"
                  className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Go to Search Businesses
                </Link>
              </div>
            )}
          />

          <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
        </section>

        <LeadDetailModal
          open={Boolean(selectedLead)}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      </div>
    </div>
  );
}

export default MyLeadsPage;