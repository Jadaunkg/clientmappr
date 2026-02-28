import React, { memo } from 'react';
import { Button } from './FormComponents';

export const PaginationControls = memo(function PaginationControls({ pagination, onPageChange }) {
  const page = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 0;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>

      <p className="text-sm text-slate-600">
        Page <strong>{page}</strong> of <strong>{Math.max(totalPages, 1)}</strong>
      </p>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={page >= totalPages || totalPages === 0}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
});

export default PaginationControls;
