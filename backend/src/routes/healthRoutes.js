/**
 * Health Check & Health Routes
 * Diagnostic endpoints for monitoring and debugging
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client for health checks
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * GET /health
 * Basic health check endpoint
 * Returns: {success, status, timestamp, environment}
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    },
    error: null,
    meta: {
      timestamp: Date.now(),
    },
  });
});

/**
 * GET /health/deep
 * Deep health check including database
 * Returns: {success, data: {all services status}, error, meta}
 */
router.get('/health/deep', async (req, res) => {
  try {
    const healthStatus = {
      server: 'OK',
      database: 'CHECKING',
      firebase: process.env.FIREBASE_PROJECT_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
      timestamp: new Date().toISOString(),
    };

    // Check database connectivity
    try {
      const { error } = await supabase.from('users').select('count(id)', { count: 'exact', head: true });
      healthStatus.database = error ? 'FAILED' : 'OK';
    } catch (dbError) {
      healthStatus.database = 'ERROR';
    }

    const isHealthy = healthStatus.server === 'OK' && healthStatus.database === 'OK';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: healthStatus,
      error: isHealthy ? null : 'Some services are not healthy',
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
      },
      meta: {
        timestamp: Date.now(),
      },
    });
  }
});

/**
 * GET /api/v1
 * API v1 information endpoint
 * Returns: {success, data: {version, endpoints}, error, meta}
 */
router.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      name: 'ClientMapr API',
      description: 'Lead Generation SaaS API',
      baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
      endpoints: {
        auth: '/auth/signup-callback (POST)',
        users: '/users/profile (GET, PUT)',
        health: '/health (GET)',
      },
      documentation: 'https://docs.clientmapr.dev',
    },
    error: null,
    meta: {
      timestamp: Date.now(),
    },
  });
});

export default router;
