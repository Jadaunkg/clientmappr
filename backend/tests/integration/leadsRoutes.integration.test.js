import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockSearchLeads = jest.fn();
const mockGetLeadById = jest.fn();
const mockUpdateLeadStatusById = jest.fn();
const mockSoftDeleteLeadById = jest.fn();
const mockEnrichLeadById = jest.fn();
const mockInvalidateLeadSearchCache = jest.fn();

jest.unstable_mockModule('../../src/services/leadsService.js', () => ({
  searchLeads: mockSearchLeads,
  getLeadById: mockGetLeadById,
  updateLeadStatusById: mockUpdateLeadStatusById,
  softDeleteLeadById: mockSoftDeleteLeadById,
  enrichLeadById: mockEnrichLeadById,
  invalidateLeadSearchCache: mockInvalidateLeadSearchCache,
}));

const { default: leadsRoutes } = await import('../../src/routes/leadsRoutes.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', leadsRoutes);
  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      error: {
        message: error.message,
      },
      meta: {
        timestamp: Date.now(),
      },
    });
  });
  return app;
};

describe('Leads routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/v1/leads parses filters and returns paginated response envelope', async () => {
    mockSearchLeads.mockResolvedValue({
      leads: [{ id: 'lead-1', business_name: 'Acme Plumbing' }],
      pagination: { page: 2, limit: 20, total: 45, totalPages: 3 },
      cache: { hit: false, key: 'leads:search:test' },
      queryPlan: { indexedFilters: ['idx_leads_city'], explainChecks: { usesIndexedFilter: true } },
    });

    const app = createApp();

    const response = await request(app)
      .get('/api/v1/leads')
      .query({ city: 'Austin', page: 2, limit: 20, sort_by: 'created_at', sort_order: 'desc' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.leads).toHaveLength(1);
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 20, total: 45, totalPages: 3 });
    expect(mockSearchLeads).toHaveBeenCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ city: 'Austin' }),
      page: 2,
      limit: 20,
    }));
  });

  test('POST /api/v1/leads/search accepts request body filters and defaults pagination', async () => {
    mockSearchLeads.mockResolvedValue({
      leads: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      cache: { hit: true, key: 'leads:search:test' },
      queryPlan: { indexedFilters: [], explainChecks: { usesIndexedFilter: false } },
    });

    const app = createApp();

    const response = await request(app)
      .post('/api/v1/leads/search')
      .send({ state: 'TX', has_website: true });

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(20);
    expect(mockSearchLeads).toHaveBeenCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ state: 'TX', has_website: true }),
    }));
  });

  test('GET /api/v1/leads/:id returns lead details', async () => {
    mockGetLeadById.mockResolvedValue({ id: 'lead-123', business_name: 'North Star HVAC' });

    const app = createApp();
    const response = await request(app).get('/api/v1/leads/lead-123');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: 'lead-123' });
    expect(mockGetLeadById).toHaveBeenCalledWith('lead-123');
  });
});
