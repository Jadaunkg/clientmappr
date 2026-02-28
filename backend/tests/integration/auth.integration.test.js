/**
 * @fileoverview Integration tests for authentication API endpoints
 * Tests complete auth flows: signup, login, OAuth, email verification, token refresh
 *
 * NOTE: These tests target auth endpoints (/api/v1/auth/signup, /api/v1/auth/login, etc.)
 * that are handled by Firebase Auth in this project.  They require a full running
 * Supabase + Firebase environment and are skipped in unit/CI runs.
 */

import { describe, test, expect, jest, beforeAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Skip – requires real Supabase/Firebase environment
describe.skip('Authentication Integration Tests', () => {
  let app;
  let supabaseClient;
  let accessToken;
  let refreshToken;
  let testUserId;
  const testEmail = 'integration-test-user@example.com';
  const testPassword = 'SecurePassword123!';
  const testFullName = 'Integration Test User';

  beforeAll(() => {
    // Import app after mocks are set up
    app = require('../../src/app');
    supabaseClient = createClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data from database
    // Note: In real scenario, use test database
  });

  describe('POST /api/v1/auth/signup - User Registration', () => {
    /**
     * Test Case 1: Successful signup with valid credentials
     * Expected: 201 status, user created, tokens generated
     */
    test('TC1-001: Should successfully signup with valid credentials', async () => {
      const signupData = {
        email: testEmail,
        password: testPassword,
        fullName: testFullName,
      };

      // Mock Supabase response
      supabaseClient.from().insert.mockResolvedValue({
        data: [{ id: 'test-user-id', email: testEmail, full_name: testFullName }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(signupData)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.fullName).toBe(testFullName);
      expect(response.body.meta.timestamp).toBeDefined();

      testUserId = response.body.data.user.id;
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    /**
     * Test Case 2: Invalid email format should return 400
     */
    test('TC1-002: Should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: testPassword,
          fullName: testFullName,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    /**
     * Test Case 3: Weak password should return 400 with requirements
     */
    test('TC1-003: Should reject password without uppercase letter', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: 'weakpassword123',
          fullName: testFullName,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('uppercase');
    });

    /**
     * Test Case 4: Email already exists should return 409
     */
    test('TC1-004: Should return 409 if email already exists', async () => {
      // First request succeeds
      supabaseClient.from().insert.mockResolvedValue({
        data: [{ id: 'test-user-id', email: testEmail }],
        error: null,
      });

      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        });

      // Second request with same email fails
      supabaseClient.from().insert.mockResolvedValue({
        data: null,
        error: { message: 'Unique violation: email' },
      });

      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          fullName: testFullName,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    /**
     * Test Case 5: Missing required fields should return 400
     */
    test('TC1-005: Should reject request with missing fullName', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /api/v1/auth/login - User Authentication', () => {
    /**
     * Test Case 6: Successful login with valid credentials
     */
    test('TC2-001: Should successfully login with valid credentials', async () => {
      // Mock database lookup
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [{
          id: testUserId,
          email: testEmail,
          password_hash: await require('bcryptjs').hash(testPassword, 10),
          full_name: testFullName,
        }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify JWT structure
      const decoded = jwt.decode(response.body.data.accessToken);
      expect(decoded.sub).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
    });

    /**
     * Test Case 7: Invalid password should return 401
     */
    test('TC2-002: Should return 401 for invalid password', async () => {
      // Mock database lookup
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [{
          id: testUserId,
          email: testEmail,
          password_hash: await require('bcryptjs').hash(testPassword, 10),
        }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      // Error message should be generic (security best practice)
      expect(response.body.error).toContain('credentials');
    });

    /**
     * Test Case 8: Non-existent user should return 401 (not 404)
     */
    test('TC2-003: Should return 401 for non-existent user', async () => {
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('credentials');
    });

    /**
     * Test Case 9: Missing email should return 400
     */
    test('TC2-004: Should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: testPassword,
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });

    /**
     * Test Case 10: Refresh token should be in secure HTTP-only cookie
     */
    test('TC2-005: Should return refresh token in secure HTTP-only cookie', async () => {
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [{
          id: testUserId,
          email: testEmail,
          password_hash: await require('bcryptjs').hash(testPassword, 10),
        }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      // Check for Set-Cookie header with refresh token
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader[0]).toContain('HttpOnly');
      expect(setCookieHeader[0]).toContain('Secure'); // In production
      expect(setCookieHeader[0]).toContain('refreshToken');
    });
  });

  describe('POST /api/v1/auth/verify-email - Email Verification', () => {
    /**
     * Test Case 11: Successfully verify email with valid token
     */
    test('TC3-001: Should verify email with valid token', async () => {
      const verificationToken = jwt.sign(
        { email: testEmail, type: 'email_verification' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Mock database update
      supabaseClient.from().update.mockResolvedValue({
        data: [{ id: testUserId, email_verified: true }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('verified');
    });

    /**
     * Test Case 12: Invalid or expired token should return 400
     */
    test('TC3-002: Should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('invalid');
    });

    /**
     * Test Case 13: Expired verification token should return 400
     */
    test('TC3-003: Should return 400 for expired token', async () => {
      const expiredToken = jwt.sign(
        { email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: expiredToken })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('POST /api/v1/auth/refresh-token - Token Refresh', () => {
    /**
     * Test Case 14: Successfully refresh access token with valid refresh token
     */
    test('TC4-001: Should refresh access token with valid refresh token', async () => {
      const oldRefreshToken = jwt.sign(
        { sub: testUserId, type: 'refresh' },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', `refreshToken=${oldRefreshToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      // Verify new token is valid
      const decoded = jwt.decode(response.body.data.accessToken);
      expect(decoded.sub).toBe(testUserId);
    });

    /**
     * Test Case 15: Missing refresh token should return 401
     */
    test('TC4-002: Should return 401 when refresh token missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('refresh token');
    });

    /**
     * Test Case 16: Invalid refresh token should return 401
     */
    test('TC4-003: Should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('invalid');
    });

    /**
     * Test Case 17: Expired refresh token should return 401
     */
    test('TC4-004: Should return 401 for expired refresh token', async () => {
      const expiredRefreshToken = jwt.sign(
        { sub: testUserId, type: 'refresh' },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '-1h' } // Expired
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', `refreshToken=${expiredRefreshToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');
    });
  });

  describe('POST /api/v1/auth/reset-password - Password Reset', () => {
    /**
     * Test Case 18: Send password reset email for existing user
     */
    test('TC5-001: Should send password reset email for existing user', async () => {
      // Mock user lookup
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [{ id: testUserId, email: testEmail }],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: testEmail })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('sent');
    });

    /**
     * Test Case 19: Non-existent email should return success (security)
     */
    test('TC5-002: Should return success for non-existent email (security)', async () => {
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: 'nonexistent@example.com' })
        .expect('Content-Type', /json/);

      // Security best practice: Always return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    /**
     * Test Case 20: Invalid email format should return 400
     */
    test('TC5-003: Should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: 'invalid-email' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });
  });

  describe('GET /api/v1/auth/google - Google OAuth Initiation', () => {
    /**
     * Test Case 21: Should redirect to Google OAuth URL
     */
    test('TC6-001: Should redirect to Google authorization URL', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google');

      expect(response.status).toBe(302); // Redirect
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('client_id=');
      expect(response.headers.location).toContain('redirect_uri=');
    });

    /**
     * Test Case 22: Should include correct OAuth scopes
     */
    test('TC6-002: Should include correct OAuth scopes', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google');

      const location = response.headers.location;
      expect(location).toContain('scope=');
      expect(location).toContain('email');
      expect(location).toContain('profile');
    });
  });

  describe('GET /api/v1/auth/google/callback - Google OAuth Callback', () => {
    /**
     * Test Case 23: Successfully handle Google OAuth callback with authorization code
     */
    test('TC7-001: Should handle Google OAuth callback and create/login user', async () => {
      const authCode = 'test-auth-code-from-google';

      // Mock Google token exchange
      jest.mock('axios');
      const mockAxios = require('axios');
      mockAxios.post.mockResolvedValue({
        data: {
          access_token: 'google-access-token',
          id_token: 'google-id-token',
        },
      });

      // Mock user profile fetch
      mockAxios.get.mockResolvedValue({
        data: {
          id: 'google-user-id',
          email: testEmail,
          name: testFullName,
        },
      });

      // Mock Supabase user lookup/creation
      supabaseClient.from().select().eq.mockResolvedValue({
        data: [{
          id: testUserId,
          oauth_provider: 'google',
          oauth_id: 'google-user-id',
        }],
        error: null,
      });

      const response = await request(app)
        .get('/api/v1/auth/google/callback')
        .query({ code: authCode })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      // Should redirect to frontend with token
      expect(response.headers.location || response.body.redirectUrl).toBeDefined();
    });

    /**
     * Test Case 24: Invalid authorization code should return error
     */
    test('TC7-002: Should return error for invalid authorization code', async () => {
      jest.mock('axios');
      const mockAxios = require('axios');
      mockAxios.post.mockRejectedValue(new Error('Invalid code'));

      const response = await request(app)
        .get('/api/v1/auth/google/callback')
        .query({ code: 'invalid-code' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    /**
     * Test Case 25: Missing authorization code should return error
     */
    test('TC7-003: Should return error when authorization code missing', async () => {
      const response = await request(app)
        .get('/api/v1/auth/google/callback')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('code');
    });
  });

  describe('Protected Route Access', () => {
    /**
     * Test Case 26: Accessing protected route with valid JWT should succeed
     */
    test('TC8-001: Should allow access with valid JWT token', async () => {
      const token = jwt.sign(
        { sub: testUserId, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    /**
     * Test Case 27: Accessing protected route without JWT should return 401
     */
    test('TC8-002: Should deny access without JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('token');
    });

    /**
     * Test Case 28: Accessing protected route with invalid JWT should return 401
     */
    test('TC8-003: Should deny access with invalid JWT', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('invalid');
    });

    /**
     * Test Case 29: Accessing protected route with expired JWT should return 401
     */
    test('TC8-004: Should deny access with expired JWT', async () => {
      const expiredToken = jwt.sign(
        { sub: testUserId },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired
      );

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');
    });
  });
});

/**
 * Integration Test Summary
 * Total Test Cases: 29
 * Coverage:
 * - User Registration (Signup): 5 tests
 * - User Login: 5 tests
 * - Email Verification: 3 tests
 * - Token Refresh: 4 tests
 * - Password Reset: 3 tests
 * - Google OAuth: 3 tests
 * - Protected Routes: 4 tests
 * Total: 29 comprehensive integration tests
 *
 * Success Criteria:
 * - All 29 tests must PASS
 * - Code coverage >85%
 * - Response times <500ms per endpoint
 * - No security vulnerabilities detected
 */
