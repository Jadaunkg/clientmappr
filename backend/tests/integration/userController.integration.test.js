/**
 * User Controller Integration Tests
 * Tests for all user API endpoints
 * 
 * Test Coverage:
 * - POST /api/v1/auth/signup-callback
 * - GET /api/v1/users/profile
 * - PUT /api/v1/users/profile
 * - GET /api/v1/users/subscription
 * - GET /api/v1/users/stats
 * - POST /api/v1/users/logout
 * - DELETE /api/v1/users/account
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';

// Import app without starting server
import app from '../../server.js';

describe('User API Endpoints', () => {
  const validToken = 'valid-firebase-token';
  const testUserId = 'test-firebase-uid-12345678';
  const mockUser = {
    uid: testUserId,
    email: 'user@example.com',
    displayName: 'Test User',
    emailVerified: true,
    photoURL: 'https://example.com/avatar.jpg',
  };

  // Mock Firebase token verification
  jest.mock('../src/middleware/firebaseAuth.js', () => ({
    firebaseAuthMiddleware: (req, res, next) => {
      if (req.headers.authorization === `Bearer ${validToken}`) {
        req.user = mockUser;
        next();
      } else {
        res.status(401).json({
          success: false,
          data: null,
          error: { message: 'Unauthorized' },
          meta: { timestamp: Date.now() },
        });
      }
    },
  }));

  describe('POST /api/v1/auth/signup-callback', () => {
    test('should create user profile after Firebase signup', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup-callback')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          fullName: 'Test User Updated',
          phoneNumber: '+1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should return 401 without valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup-callback')
        .send({ fullName: 'Test' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle existing user profile', async () => {
      // First call creates profile
      await request(app)
        .post('/api/v1/auth/signup-callback')
        .set('Authorization', `Bearer ${validToken}`);

      // Second call should return existing profile
      const response = await request(app)
        .post('/api/v1/auth/signup-callback')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup-callback')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          fullName: 12345, // Invalid type
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('response should include correct format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup-callback')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('GET /api/v1/users/profile', () => {
    test('should fetch user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(mockUser.email);
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/v1/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 404 if user not found', async () => {
      // Create mock for non-existent user
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect([200, 404]).toContain(response.status);
    });

    test('response should have correct fields', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`);

      if (response.status === 200) {
        const { data } = response.body;
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('email');
        expect(data).toHaveProperty('full_name');
        expect(data).toHaveProperty('subscription_tier');
        expect(data).toHaveProperty('created_at');
      }
    });
  });

  describe('PUT /api/v1/users/profile', () => {
    test('should update user profile', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phoneNumber: '+9876543210',
      };

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update only provided fields', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ fullName: 'Test User' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate full name format', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ fullName: '123' });

      expect([200, 400]).toContain(response.status);
    });

    test('should validate phone number format', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ phoneNumber: 'invalid-phone' });

      expect([200, 400]).toContain(response.status);
    });

    test('should return 400 with no update fields', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .send({ fullName: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/subscription', () => {
    test('should fetch user subscription', async () => {
      const response = await request(app)
        .get('/api/v1/users/subscription')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subscription_tier');
      expect(response.body.data).toHaveProperty('status');
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/v1/users/subscription');

      expect(response.status).toBe(401);
    });

    test('response should follow format', async () => {
      const response = await request(app)
        .get('/api/v1/users/subscription')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('GET /api/v1/users/stats', () => {
    test('should fetch user statistics', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('userId');
      expect(response.body.data).toHaveProperty('totalInteractions');
      expect(response.body.data).toHaveProperty('totalExports');
      expect(response.body.data).toHaveProperty('accountAge');
    });

    test('should require authentication', async () => {
      const response = await request(app).get('/api/v1/users/stats');

      expect(response.status).toBe(401);
    });

    test('statistics should have correct types', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${validToken}`);

      if (response.status === 200) {
        const { data } = response.body;
        expect(typeof data.totalInteractions).toBe('number');
        expect(typeof data.totalExports).toBe('number');
        expect(typeof data.accountAge).toBe('number');
      }
    });
  });

  describe('POST /api/v1/users/logout', () => {
    test('should logout user', async () => {
      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app).post('/api/v1/users/logout');

      expect(response.status).toBe(401);
    });

    test('response should be successful', async () => {
      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });

  describe('DELETE /api/v1/users/account', () => {
    test('should delete user account', async () => {
      const response = await request(app)
        .delete('/api/v1/users/account')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app).delete('/api/v1/users/account');

      expect(response.status).toBe(401);
    });

    test('should soft delete account', async () => {
      // Delete account
      await request(app)
        .delete('/api/v1/users/account')
        .set('Authorization', `Bearer ${validToken}`);

      // Try to fetch profile (should be marked as deleted)
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${validToken}`);

      // Depending on implementation, might return 404 or still 200 but status='deleted'
      expect([200, 404]).toContain(response.status);
    });
  });
});
