import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockSearchLeads = jest.fn();

jest.unstable_mockModule('../../src/services/leadsService.js', () => ({
  searchLeads: mockSearchLeads,
  getLeadById: jest.fn(),
  updateLeadStatusById: jest.fn(),
  softDeleteLeadById: jest.fn(),
  enrichLeadById: jest.fn(),
}));

const { default: leadsRoutes } = await import('../../src/routes/leadsRoutes.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', leadsRoutes);
  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message,
      },
    });
  });
  return app;
};

describe('Leads search performance integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSearchLeads.mockResolvedValue({
      leads: Array.from({ length: 20 }, (_, index) => ({
        id: `lead-${index}`,
        business_name: `Business ${index}`,
      })),
      pagination: {
        page: 1,
        limit: 20,
        total: 100000,
        totalPages: 5000,
      },
      cache: {
        hit: false,
        key: 'leads:search:performance',
      },
      queryPlan: {
        indexedFilters: ['idx_leads_status_created_at'],
        explainChecks: {
          usesIndexedFilter: true,
        },
      },
    });
  });

  test('handles repeated high-volume search requests with stable response envelope', async () => {
    const app = createApp();
    const rounds = 25;
    const durations = [];

    for (let i = 0; i < rounds; i += 1) {
      const started = performance.now();
      const response = await request(app)
        .post('/api/v1/leads/search')
        .send({
          page: 1,
          limit: 20,
          status: 'validated',
          sort_by: 'created_at',
          sort_order: 'desc',
        });

      durations.push(performance.now() - started);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leads).toHaveLength(20);
      expect(response.body.pagination.limit).toBe(20);
    }

    const averageMs = durations.reduce((acc, value) => acc + value, 0) / durations.length;
    expect(averageMs).toBeLessThan(120);
    expect(mockSearchLeads).toHaveBeenCalledTimes(rounds);
  });
});
