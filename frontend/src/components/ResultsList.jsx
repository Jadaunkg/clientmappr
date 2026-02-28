import React, { memo, useMemo } from 'react';
import LeadCard from './LeadCard';

function LoadingSkeleton({ viewMode }) {
  const isGrid = viewMode === 'grid';

  return (
    <div className={isGrid ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-200" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
          <div className="mt-4 h-6 w-1/3 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export const ResultsList = memo(function ResultsList({
  leads = [],
  loading = false,
  error = '',
  viewMode = 'grid',
  onSelectLead,
  emptyState = null,
}) {
  const containerClassName = viewMode === 'grid'
    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
    : 'space-y-3';

  const renderedLeadCards = useMemo(() => {
    return leads.map((lead) => (
      <LeadCard
        key={lead.id}
        lead={lead}
        viewMode={viewMode}
        onViewDetails={onSelectLead}
      />
    ));
  }, [leads, onSelectLead, viewMode]);

  if (loading) {
    return <LoadingSkeleton viewMode={viewMode} />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        {emptyState || 'No results found. Adjust your filters and try again.'}
      </div>
    );
  }

  return <div className={containerClassName}>{renderedLeadCards}</div>;
});

export default ResultsList;
