import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockSearchLeads = jest.fn();
const mockGetLeadById = jest.fn();
const mockUpdateLeadStatusById = jest.fn();
const mockSoftDeleteLeadById = jest.fn();
const mockEnrichLeadById = jest.fn();

jest.unstable_mockModule('../../src/services/leadsService.js', () => ({
  searchLeads: mockSearchLeads,
  getLeadById: mockGetLeadById,
  updateLeadStatusById: mockUpdateLeadStatusById,
  softDeleteLeadById: mockSoftDeleteLeadById,
  enrichLeadById: mockEnrichLeadById,
}));

jest.unstable_mockModule('../../src/middleware/firebaseAuth.js', () => ({
  firebaseAuthMiddleware: (req, res, next) => {
    req.user = {
      uid: 'test-user-1',
      customClaims: { subscription_tier: req.headers['x-tier'] || 'professional' },
    };
    next();
  },
  requireSubscription: (minTier) => (req, res, next) => {
    const ranking = { free_trial: 0, starter: 1, professional: 2, enterprise: 3 };
    const tier = req.user?.customClaims?.subscription_tier || 'free_trial';

    if (ranking[tier] < ranking[minTier]) {
      const err = new Error('Insufficient subscription tier');
      err.statusCode = 403;
      return next(err);
    }

    return next();
  },
}));

jest.unstable_mockModule('../../src/middleware/googleMapsRateLimit.js', () => ({
  googleMapsRateLimitMiddleware: (req, res, next) => next(),
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
      error: { message: error.message },
      meta: { timestamp: Date.now() },
    });
  });
  return app;
};

describe('Leads mutation routes integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/v1/leads/enrich enriches lead for professional tier', async () => {
    mockEnrichLeadById.mockResolvedValue({ id: 'lead-1', status: 'enriched' });

    const app = createApp();
    const response = await request(app)
      .post('/api/v1/leads/enrich')
      .set('x-tier', 'professional')
      .send({ leadId: '6b43a8e7-31f4-4a99-8be5-cf7f2936f2d1' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockEnrichLeadById).toHaveBeenCalledWith(expect.objectContaining({
      leadId: '6b43a8e7-31f4-4a99-8be5-cf7f2936f2d1',
      requestedBy: 'test-user-1',
    }));
  });

  test('POST /api/v1/leads/enrich rejects low subscription tier', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/v1/leads/enrich')
      .set('x-tier', 'starter')
      .send({ leadId: '6b43a8e7-31f4-4a99-8be5-cf7f2936f2d1' });

    expect(response.status).toBe(403);
  });

  test('PUT /api/v1/leads/:id/status updates status', async () => {
    mockUpdateLeadStatusById.mockResolvedValue({ id: 'lead-2', status: 'validated' });

    const app = createApp();
    const response = await request(app)
      .put('/api/v1/leads/lead-2/status')
      .send({ status: 'validated' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('validated');
    expect(mockUpdateLeadStatusById).toHaveBeenCalledWith('lead-2', 'validated');
  });

  test('DELETE /api/v1/leads/:id soft deletes lead', async () => {
    mockSoftDeleteLeadById.mockResolvedValue({ id: 'lead-3', status: 'archived' });

    const app = createApp();
    const response = await request(app).delete('/api/v1/leads/lead-3');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('archived');
    expect(mockSoftDeleteLeadById).toHaveBeenCalledWith('lead-3');
  });
});
