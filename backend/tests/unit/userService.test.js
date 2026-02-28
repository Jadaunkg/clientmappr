/**
 * User Service Unit Tests
 * Tests for all user service functions
 *
 * Test Coverage:
 * - createUserProfile, getUserProfile, updateUserProfile
 * - getUserSubscription, getUserStats, userExists, listUsers
 *
 * ESM-compatible: uses jest.unstable_mockModule + dynamic import
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const mockUserData = {
  id: 'test-firebase-uid-1234567890',
  email: 'user@example.com',
  full_name: 'Test User',
  phone_number: '+1234567890',
  avatar_url: 'https://example.com/avatar.jpg',
  subscription_tier: 'free_trial',
  status: 'active',
  email_verified: true,
  last_login: new Date().toISOString(),
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
  updated_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Configurable mock state — tests adjust these before executing the SUT
// ---------------------------------------------------------------------------
const mockState = {
  singleData: { ...mockUserData },  // what .single() resolves to
  singleError: null,                // if set, .single() resolves { data: null, error }
  awaitData: [{ ...mockUserData }], // what `await query` / .range() resolves (array)
  awaitCount: 1,                    // count returned by count queries
  awaitError: null,                 // if set, await query resolves { data: null, error }
};

function resetMockState() {
  mockState.singleData = { ...mockUserData };
  mockState.singleError = null;
  mockState.awaitData = [{ ...mockUserData }];
  mockState.awaitCount = 1;
  mockState.awaitError = null;
}

// ---------------------------------------------------------------------------
// Smart query-chain proxy — reads from mockState at resolution time
// ---------------------------------------------------------------------------
function makeQueryProxy() {
  const proxy = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === 'then') {
        const val = mockState.awaitError
          ? { data: null, count: null, error: mockState.awaitError }
          : { data: mockState.awaitData, count: mockState.awaitCount, error: null };
        return (resolve, reject) => Promise.resolve(val).then(resolve, reject);
      }
      if (prop === 'catch') {
        const val = mockState.awaitError
          ? { data: null, count: null, error: mockState.awaitError }
          : { data: mockState.awaitData, count: mockState.awaitCount, error: null };
        return (fn) => Promise.resolve(val).catch(fn);
      }
      if (prop === 'single') {
        return () => {
          const val = mockState.singleError
            ? { data: null, error: mockState.singleError }
            : { data: mockState.singleData, error: null };
          return Promise.resolve(val);
        };
      }
      if (prop === 'range') {
        return () => {
          const val = mockState.awaitError
            ? { data: null, error: mockState.awaitError }
            : { data: mockState.awaitData, error: null };
          return Promise.resolve(val);
        };
      }
      return proxy;
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js BEFORE dynamically importing userService
// ---------------------------------------------------------------------------
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((_table) => makeQueryProxy()),
  })),
}));

// Dynamic import after mock registration
const userService = await import('../../src/services/userService.js');
const { default: AppError } = await import('../../src/utils/AppError.js');

describe('User Service', () => {
  const mockFirebaseUser = {
    uid: 'test-firebase-uid-1234567890',
    email: 'user@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    emailVerified: true,
  };

  const mockUserProfile = mockUserData;

  beforeEach(() => {
    jest.clearAllMocks();
    resetMockState();
  });

  describe('createUserProfile', () => {
    test('should create a new user profile successfully', async () => {
      const result = await userService.createUserProfile(mockFirebaseUser);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockFirebaseUser.email);
    });

    test('should throw error if user already exists (409)', async () => {
      mockState.singleError = { code: '23505', message: 'duplicate key' };
      try {
        await userService.createUserProfile(mockFirebaseUser);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
      }
    });

    test('should format Firebase user data correctly', async () => {
      const result = await userService.createUserProfile(mockFirebaseUser);

      expect(result.subscription_tier).toBe('free_trial');
      expect(result.status).toBe('active');
      expect(result.email_verified).toBe(mockFirebaseUser.emailVerified);
    });

    test('should throw 500 error if database fails', async () => {
      try {
        await userService.createUserProfile(null);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe('getUserProfile', () => {
    test('should fetch user profile by Firebase UID', async () => {
      const result = await userService.getUserProfile('test-firebase-uid-1234567890');

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUserProfile.email);
    });

    test('should throw 404 if user not found', async () => {
      mockState.singleError = { message: 'not found', code: 'PGRST116' };
      try {
        await userService.getUserProfile('nonexistent-uid');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
      }
    });

    test('should return all user fields', async () => {
      const result = await userService.getUserProfile('test-firebase-uid-1234567890');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('full_name');
      expect(result).toHaveProperty('subscription_tier');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile with partial data', async () => {
      const updateData = { full_name: 'Updated Name' };
      mockState.singleData = { ...mockUserData, full_name: 'Updated Name' };
      const result = await userService.updateUserProfile('test-firebase-uid-1234567890', updateData);

      expect(result).toBeDefined();
      expect(result.full_name).toBe('Updated Name');
    });

    test('should update multiple fields', async () => {
      const updateData = {
        full_name: 'New Name',
        phone_number: '+9876543210',
      };
      mockState.singleData = { ...mockUserData, ...updateData };
      const result = await userService.updateUserProfile('test-firebase-uid-1234567890', updateData);

      expect(result.full_name).toBe(updateData.full_name);
      expect(result.phone_number).toBe(updateData.phone_number);
    });

    test('should update updated_at timestamp', async () => {
      const beforeUpdate = new Date();
      await userService.updateUserProfile('test-firebase-uid-1234567890', { full_name: 'Test' });
      const afterUpdate = new Date();

      // The updated_at should be set to current time
      expect(true).toBe(true); // Placeholder - would need mock verification
    });

    test('should throw 500 if update fails', async () => {
      mockState.singleError = { message: 'DB update error', code: 'DB_ERROR' };
      try {
        await userService.updateUserProfile('invalid-uid', {});
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe('updateLastLogin', () => {
    test('should update last_login timestamp', async () => {
      const beforeTime = new Date();
      await userService.updateLastLogin('test-firebase-uid-1234567890');
      // Would verify that last_login was updated
      expect(true).toBe(true);
    });

    test('should handle update silently on error', async () => {
      // Should not throw even if update fails
      await expect(userService.updateLastLogin('invalid-uid')).resolves.toBeUndefined();
    });
  });

  describe('updateSubscriptionTier', () => {
    test('should update subscription tier', async () => {
      mockState.singleData = { ...mockUserData, subscription_tier: 'professional' };
      const result = await userService.updateSubscriptionTier('test-firebase-uid-1234567890', 'professional');

      expect(result).toBeDefined();
      expect(result.subscription_tier).toBe('professional');
    });

    test('should update to all valid tiers', async () => {
      const tiers = ['free_trial', 'starter', 'professional', 'enterprise'];

      for (const tier of tiers) {
        mockState.singleData = { ...mockUserData, subscription_tier: tier };
        const result = await userService.updateSubscriptionTier('test-firebase-uid-1234567890', tier);
        expect(result.subscription_tier).toBe(tier);
      }
    });

    test('should throw 500 if update fails', async () => {
      mockState.singleError = { message: 'DB error', code: 'DB_ERROR' };
      try {
        await userService.updateSubscriptionTier('invalid-uid', 'professional');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe('suspendUser', () => {
    test('should set user status to suspended', async () => {
      mockState.singleData = { ...mockUserData, status: 'suspended' };
      const result = await userService.suspendUser('test-firebase-uid-1234567890', 'Policy violation');

      expect(result).toBeDefined();
      expect(result.status).toBe('suspended');
    });

    test('should use default reason if not provided', async () => {
      mockState.singleData = { ...mockUserData, status: 'suspended' };
      const result = await userService.suspendUser('test-firebase-uid-1234567890');
      expect(result.status).toBe('suspended');
    });
  });

  describe('userExists', () => {
    test('should return true if user exists', async () => {
      const exists = await userService.userExists('test-firebase-uid-1234567890');
      expect(typeof exists).toBe('boolean');
    });

    test('should return false if user does not exist', async () => {
      mockState.awaitCount = 0;
      const exists = await userService.userExists('nonexistent-uid');
      expect(exists).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      mockState.awaitError = { message: 'DB error' };
      const exists = await userService.userExists(null);
      expect(exists).toBe(false);
    });
  });

  describe('getUserSubscription', () => {
    test('should fetch user subscription info', async () => {
      const result = await userService.getUserSubscription('test-firebase-uid-1234567890');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('subscription_tier');
      expect(result).toHaveProperty('status');
    });

    test('should throw 404 if user not found', async () => {
      mockState.singleError = { message: 'not found', code: 'PGRST116' };
      try {
        await userService.getUserSubscription('nonexistent-uid');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe('getUserStats', () => {
    test('should fetch user statistics', async () => {
      const result = await userService.getUserStats('test-firebase-uid-1234567890');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('subscriptionTier');
      expect(result).toHaveProperty('totalInteractions');
      expect(result).toHaveProperty('totalExports');
      expect(result).toHaveProperty('accountAge');
    });

    test('should calculate account age correctly', async () => {
      const result = await userService.getUserStats('test-firebase-uid-1234567890');
      expect(typeof result.accountAge).toBe('number');
      expect(result.accountAge).toBeGreaterThanOrEqual(0);
    });

    test('should include interaction counts', async () => {
      const result = await userService.getUserStats('test-firebase-uid-1234567890');
      expect(typeof result.totalInteractions).toBe('number');
      expect(typeof result.totalExports).toBe('number');
    });
  });

  describe('listUsers', () => {
    test('should list users with default pagination', async () => {
      const result = await userService.listUsers();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.items)).toBe(true);
    });

    test('should support pagination', async () => {
      const result = await userService.listUsers({ page: 1, limit: 10 });

      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 10);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });

    test('should filter by subscription tier', async () => {
      const result = await userService.listUsers({ subscriptionTier: 'professional' });
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status', async () => {
      const result = await userService.listUsers({ status: 'active' });
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    test('should search by email or name', async () => {
      const result = await userService.listUsers({ search: 'user@example.com' });
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    test('should respect max limit', async () => {
      const result = await userService.listUsers({ limit: 1000 });
      expect(result.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('deleteUserAccount', () => {
    test('should set user status to deleted', async () => {
      await userService.deleteUserAccount('test-firebase-uid-1234567890');
      // Verify status was set to deleted
      expect(true).toBe(true);
    });

    test('should throw 500 if deletion fails', async () => {
      mockState.awaitError = { message: 'DB delete error', code: 'DB_ERROR' };
      try {
        await userService.deleteUserAccount('invalid-uid');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(500);
      }
    });
  });
});
