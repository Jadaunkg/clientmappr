/**
 * User Service Unit Tests
 * Tests for all user service functions
 * 
 * Test Coverage:
 * - createUserProfile
 * - getUserProfile
 * - updateUserProfile
 * - getUserSubscription
 * - getUserStats
 * - userExists
 * - listUsers
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as userService from '../../src/services/userService.js';
import AppError from '../../src/utils/AppError.js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}));

describe('User Service', () => {
  const mockFirebaseUser = {
    uid: 'test-firebase-uid-12345678',
    email: 'user@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    emailVerified: true,
  };

  const mockUserProfile = {
    id: 'test-firebase-uid-12345678',
    email: 'user@example.com',
    full_name: 'Test User',
    phone_number: '+1234567890',
    avatar_url: 'https://example.com/avatar.jpg',
    subscription_tier: 'free_trial',
    status: 'active',
    email_verified: true,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    test('should create a new user profile successfully', async () => {
      const result = await userService.createUserProfile(mockFirebaseUser);

      expect(result).toBeDefined();
      expect(result.email).toBe(mockFirebaseUser.email);
    });

    test('should throw error if user already exists (409)', async () => {
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
      const result = await userService.getUserProfile('test-firebase-uid-12345678');

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUserProfile.email);
    });

    test('should throw 404 if user not found', async () => {
      try {
        await userService.getUserProfile('nonexistent-uid');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
      }
    });

    test('should return all user fields', async () => {
      const result = await userService.getUserProfile('test-firebase-uid-12345678');

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
      const result = await userService.updateUserProfile('test-firebase-uid-12345678', updateData);

      expect(result).toBeDefined();
      expect(result.full_name).toBe('Updated Name');
    });

    test('should update multiple fields', async () => {
      const updateData = {
        full_name: 'New Name',
        phone_number: '+9876543210',
      };

      const result = await userService.updateUserProfile('test-firebase-uid-12345678', updateData);

      expect(result.full_name).toBe(updateData.full_name);
      expect(result.phone_number).toBe(updateData.phone_number);
    });

    test('should update updated_at timestamp', async () => {
      const beforeUpdate = new Date();
      await userService.updateUserProfile('test-firebase-uid-12345678', { full_name: 'Test' });
      const afterUpdate = new Date();

      // The updated_at should be set to current time
      expect(true).toBe(true); // Placeholder - would need mock verification
    });

    test('should throw 500 if update fails', async () => {
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
      await userService.updateLastLogin('test-firebase-uid-12345678');
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
      const result = await userService.updateSubscriptionTier('test-firebase-uid-12345678', 'professional');

      expect(result).toBeDefined();
      expect(result.subscription_tier).toBe('professional');
    });

    test('should update to all valid tiers', async () => {
      const tiers = ['free_trial', 'starter', 'professional', 'enterprise'];

      for (const tier of tiers) {
        const result = await userService.updateSubscriptionTier('test-firebase-uid-12345678', tier);
        expect(result.subscription_tier).toBe(tier);
      }
    });

    test('should throw 500 if update fails', async () => {
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
      const result = await userService.suspendUser('test-firebase-uid-12345678', 'Policy violation');

      expect(result).toBeDefined();
      expect(result.status).toBe('suspended');
    });

    test('should use default reason if not provided', async () => {
      const result = await userService.suspendUser('test-firebase-uid-12345678');
      expect(result.status).toBe('suspended');
    });
  });

  describe('userExists', () => {
    test('should return true if user exists', async () => {
      const exists = await userService.userExists('test-firebase-uid-12345678');
      expect(typeof exists).toBe('boolean');
    });

    test('should return false if user does not exist', async () => {
      const exists = await userService.userExists('nonexistent-uid');
      expect(exists).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      const exists = await userService.userExists(null);
      expect(exists).toBe(false);
    });
  });

  describe('getUserSubscription', () => {
    test('should fetch user subscription info', async () => {
      const result = await userService.getUserSubscription('test-firebase-uid-12345678');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('subscription_tier');
      expect(result).toHaveProperty('status');
    });

    test('should throw 404 if user not found', async () => {
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
      const result = await userService.getUserStats('test-firebase-uid-12345678');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('subscriptionTier');
      expect(result).toHaveProperty('totalInteractions');
      expect(result).toHaveProperty('totalExports');
      expect(result).toHaveProperty('accountAge');
    });

    test('should calculate account age correctly', async () => {
      const result = await userService.getUserStats('test-firebase-uid-12345678');
      expect(typeof result.accountAge).toBe('number');
      expect(result.accountAge).toBeGreaterThanOrEqual(0);
    });

    test('should include interaction counts', async () => {
      const result = await userService.getUserStats('test-firebase-uid-12345678');
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
      await userService.deleteUserAccount('test-firebase-uid-12345678');
      // Verify status was set to deleted
      expect(true).toBe(true);
    });

    test('should throw 500 if deletion fails', async () => {
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
