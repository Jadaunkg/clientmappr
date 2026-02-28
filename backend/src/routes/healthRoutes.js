/**
 * Health Check & Health Routes
 * Diagnostic endpoints for monitoring and debugging
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { checkRedisHealth } from '../config/redis.js';
import { checkElasticsearchHealth } from '../config/elasticsearch.js';

const router = express.Router();

const getSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return null;
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

/**
 * GET /
 * Root endpoint
 * Returns basic API information
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'ClientMapr API is running',
      version: '1.0.0',
    },
    error: null,
    meta: {
      timestamp: Date.now(),
    },
  });
});

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
      redis: 'CHECKING',
      elasticsearch: 'CHECKING',
      firebase: process.env.FIREBASE_PROJECT_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
      timestamp: new Date().toISOString(),
      details: {},
    };

    // Check database connectivity
    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        healthStatus.database = 'NOT_CONFIGURED';
        healthStatus.details.database = 'SUPABASE_URL or SUPABASE_SERVICE_KEY is missing';
      } else {
        const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
        healthStatus.database = error ? 'FAILED' : 'OK';
        healthStatus.details.database = error ? error.message : 'Supabase query successful';
      }
    } catch (dbError) {
      healthStatus.database = 'FAILED';
      healthStatus.details.database = dbError.message;
    }

    const redisHealth = await checkRedisHealth();
    healthStatus.redis = redisHealth.status;
    healthStatus.details.redis = redisHealth.details;

    const elasticHealth = await checkElasticsearchHealth();
    healthStatus.elasticsearch = elasticHealth.status;
    healthStatus.details.elasticsearch = elasticHealth.details;

    const isHealthy = healthStatus.server === 'OK'
      && healthStatus.database !== 'FAILED'
      && healthStatus.redis !== 'FAILED'
      && healthStatus.elasticsearch !== 'FAILED';

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
