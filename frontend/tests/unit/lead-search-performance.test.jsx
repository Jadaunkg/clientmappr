/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsList from '../../src/components/ResultsList';

const buildLead = (index) => ({
  id: `lead-${index}`,
  business_name: `Business ${index}`,
  address: `${index} Main St`,
  business_category: 'plumber',
  google_rating: 4.2,
  city: 'Austin',
  has_website: index % 2 === 0,
  status: 'validated',
});

describe('Lead search performance scenarios', () => {
  test('renders high-volume lead list payload without crashing', () => {
    const leads = Array.from({ length: 1200 }, (_, index) => buildLead(index));

    const startedAt = Date.now();
    render(
      <ResultsList
        leads={leads}
        loading={false}
        error=""
        viewMode="list"
      />,
    );

    expect(screen.getByText('Business 0')).toBeInTheDocument();
    expect(screen.getByText('Business 1199')).toBeInTheDocument();

    const durationMs = Date.now() - startedAt;
    expect(durationMs).toBeLessThan(5000);
  });

  test('shows loading skeleton immediately for large searches in progress', () => {
    const leads = Array.from({ length: 500 }, (_, index) => buildLead(index));

    const { container } = render(
      <ResultsList
        leads={leads}
        loading
        error=""
        viewMode="grid"
      />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
