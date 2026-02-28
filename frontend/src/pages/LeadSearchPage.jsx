import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, FormLabel } from '../components/FormComponents';
import ResultsList from '../components/ResultsList';
import LeadDetailModal from '../components/LeadDetailModal';
import PaginationControls from '../components/PaginationControls';
import {
  searchLeads,
  discoverLeads,
  getLeadDiscoveryStatus,
  getLeadDiscoveryResults,
} from '../services/leadsService';

const SEARCH_PERSISTENCE_KEY = 'leadSearchState';

const defaultFilters = {
  city: '',
  business_category: '',
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

const getSavedSearchState = () => {
  try {
    const raw = localStorage.getItem(SEARCH_PERSISTENCE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const mapFiltersToPayload = (filters) => {
  return {
    city: filters.city || undefined,
    business_category: filters.business_category || undefined,
  };
};

function LeadSearchPage() {
  const [filters, setFilters] = useState(() => {
    return getSavedSearchState()?.filters || defaultFilters;
  });
  const [viewMode, setViewMode] = useState(() => {
    return getSavedSearchState()?.viewMode || 'grid';
  });
  const [pagination, setPagination] = useState(() => {
    return getSavedSearchState()?.pagination || defaultPagination;
  });
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [discoveryRunId, setDiscoveryRunId] = useState(null);
  const [discoveryStatus, setDiscoveryStatus] = useState('idle');
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [isTransitionPending, startTransition] = useTransition();

  const sleep = (durationMs) => new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

  const executeSearch = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...mapFiltersToPayload(filters),
        page,
        limit: 20,
      };

      const response = await searchLeads(payload);
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
  }, [filters]);

  const loadDiscoveryResultsPage = useCallback(async (runId, page = 1) => {
    const response = await getLeadDiscoveryResults(runId, { page, limit: 60 });
    startTransition(() => {
      setLeads(response.leads);
      setPagination(response.pagination || defaultPagination);
    });
    return response.pagination;
  }, []);

  const runDiscoverySearch = useCallback(async () => {
    if (!filters.city || !filters.business_category) {
      setError('City and Category are required for live discovery.');
      return;
    }

    setLoading(true);
    setError('');
    setDiscoveryStatus('queued');

    try {
      const discovery = await discoverLeads({
        city: filters.city,
        business_category: filters.business_category,
        limit: 60,
      });

      if (!discovery?.runId) {
        throw new Error('Discovery run did not start');
      }

      setDiscoveryRunId(discovery.runId);

      if (discovery.status === 'completed') {
        const resultsPage = await loadDiscoveryResultsPage(discovery.runId, 1);
        setDiscoveredCount(resultsPage?.total || 0);
        setDiscoveryStatus('completed');
        setFilters(defaultFilters);
        return;
      }

      for (let attempt = 0; attempt < 45; attempt += 1) {
        const status = await getLeadDiscoveryStatus(discovery.runId);
        setDiscoveryStatus(status.status || 'queued');

        if (status.status === 'completed') {
          const resultsRes = await loadDiscoveryResultsPage(discovery.runId, 1);
          setDiscoveredCount(resultsRes?.total || 0);
          setFilters(defaultFilters);
          return;
        }

        if (status.status === 'failed') {
          throw new Error(status.errorMessage || 'Live discovery failed. Please try again.');
        }

        // eslint-disable-next-line no-await-in-loop
        await sleep(2000);
      }

      throw new Error('Live discovery timed out. Please retry.');
    } catch (apiError) {
      const message = apiError?.response?.data?.error?.message || apiError?.message || 'Failed to discover leads.';
      setError(message);
      setLeads([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      setDiscoveryStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [filters, loadDiscoveryResultsPage]);

  useEffect(() => {
    localStorage.setItem(SEARCH_PERSISTENCE_KEY, JSON.stringify({
      filters,
      pagination,
      viewMode,
    }));
  }, [filters, pagination, viewMode]);

  useEffect(() => {
    // We intentionally do not auto-execute search on page load here 
    // to prevent unwanted API requests or automatic form submissions.
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    runDiscoverySearch();
  };

  const handlePageChange = (nextPage) => {
    if (discoveryRunId && discoveryStatus === 'completed') {
      setLoading(true);
      setError('');
      loadDiscoveryResultsPage(discoveryRunId, nextPage)
        .catch((apiError) => {
          const message = apiError?.response?.data?.error?.message || 'Failed to load discovery results.';
          setError(message);
        })
        .finally(() => setLoading(false));
      return;
    }

    executeSearch(nextPage);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setDiscoveryRunId(null);
    setDiscoveryStatus('idle');
    setTimeout(() => executeSearch(1), 0);
  };

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Search Businesses</h1>
            <p className="mt-1 text-sm text-slate-600">
              Run live discovery and find verified businesses without websites.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            {discoveryStatus === 'completed' && (
              <Link
                to="/my-leads"
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                View My Leads →
              </Link>
            )}
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <FormLabel htmlFor="city">City</FormLabel>
              <Input
                id="city"
                value={filters.city}
                onChange={(event) => handleFilterChange('city', event.target.value)}
                placeholder="Austin"
              />
            </div>

            <div>
              <FormLabel htmlFor="business_category">Category</FormLabel>
              <Input
                id="business_category"
                value={filters.business_category}
                onChange={(event) => handleFilterChange('business_category', event.target.value)}
                placeholder="Plumber"
              />
            </div>



            <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-3">
              <Button type="submit" loading={loading}>Discover Leads</Button>
              <Button type="button" variant="secondary" onClick={clearFilters}>Clear Filters</Button>
              {(discoveryStatus === 'queued' || discoveryStatus === 'running') && (
                <span className="text-sm text-blue-700 animate-pulse">Fetching up to 60 leads from Google…</span>
              )}
              {discoveryStatus === 'completed' && (
                <span className="text-sm font-medium text-green-700">
                  ✓ {pagination.total || discoveredCount || 0} leads saved to your account
                </span>
              )}
              <p className="text-sm text-slate-600 ml-auto">
                Results: <strong>{pagination.total || 0}</strong>
              </p>
            </div>
          </form>
        </section>

        <section className="mt-5 space-y-4">
          <ResultsList
            leads={leads}
            loading={loading || isTransitionPending}
            error={error}
            viewMode={viewMode}
            onSelectLead={setSelectedLead}
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

export default LeadSearchPage;
