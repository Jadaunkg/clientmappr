/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsList from '../../src/components/ResultsList';
import PaginationControls from '../../src/components/PaginationControls';

describe('Lead Search components', () => {
  test('renders lead list cards', () => {
    render(
      <ResultsList
        leads={[
          {
            id: '1',
            business_name: 'Acme Plumbing',
            address: '123 Main St',
            business_category: 'plumber',
            google_rating: 4.5,
            city: 'Austin',
            has_website: false,
            status: 'new',
          },
        ]}
        loading={false}
        error=""
        viewMode="grid"
      />,
    );

    expect(screen.getByText('Acme Plumbing')).toBeInTheDocument();
    expect(screen.getByText(/No website/i)).toBeInTheDocument();
  });

  test('handles pagination next click', () => {
    const onPageChange = jest.fn();

    render(
      <PaginationControls
        pagination={{ page: 1, totalPages: 3 }}
        onPageChange={onPageChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('shows loading skeleton state', () => {
    const { container } = render(
      <ResultsList leads={[]} loading error="" viewMode="grid" />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  test('shows error state', () => {
    render(
      <ResultsList
        leads={[]}
        loading={false}
        error="Failed to load leads"
        viewMode="grid"
      />,
    );

    expect(screen.getByText('Failed to load leads')).toBeInTheDocument();
  });

  test('shows empty results state', () => {
    render(
      <ResultsList
        leads={[]}
        loading={false}
        error=""
        viewMode="list"
      />,
    );

    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });
});
