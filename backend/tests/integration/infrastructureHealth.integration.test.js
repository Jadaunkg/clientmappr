import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

describe('Infrastructure Health Smoke', () => {
  test('GET /health/deep returns infrastructure status envelope', async () => {
    const response = await request(app).get('/health/deep');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('database');
    expect(response.body.data).toHaveProperty('redis');
    expect(response.body.data).toHaveProperty('elasticsearch');
    expect(response.body.data).toHaveProperty('details');
  });
});
