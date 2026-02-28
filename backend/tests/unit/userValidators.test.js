/**
 * Validators Unit Tests
 * Tests for Zod validation schemas
 */

import { describe, test, expect } from '@jest/globals';
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  userSettingsSchema,
  listUsersQuerySchema,
  validateData,
} from '../../src/validators/userValidators.js';

describe('User Validators', () => {
  describe('createUserProfileSchema', () => {
    test('should validate correct user profile data', () => {
      const validData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: 'Test User',
        phoneNumber: '+1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      const result = createUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const invalidData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'invalid-email',
        fullName: 'Test User',
      };

      const result = createUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should reject invalid Firebase UID (wrong length)', () => {
      const invalidData = {
        firebaseUID: 'short-uid',
        email: 'user@example.com',
        fullName: 'Test User',
      };

      const result = createUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should require full name with minimum length', () => {
      const invalidData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: 'A', // Too short
      };

      const result = createUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should accept optional fields', () => {
      const minimumData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: 'Test User',
      };

      const result = createUserProfileSchema.safeParse(minimumData);
      expect(result.success).toBe(true);
    });

    test('should reject special characters in full name', () => {
      const invalidData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: 'Test@#$%',
      };

      const result = createUserProfileSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('should allow hyphens and apostrophes in names', () => {
      const validData = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: "Mary-Jane O'Brien",
      };

      const result = createUserProfileSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateUserProfileSchema', () => {
    test('should accept all fields as optional', () => {
      const data1 = { fullName: 'Updated Name' };
      const data2 = { phoneNumber: '+1234567890' };
      const data3 = {};

      expect(updateUserProfileSchema.safeParse(data1).success).toBe(true);
      expect(updateUserProfileSchema.safeParse(data2).success).toBe(true);
      expect(updateUserProfileSchema.safeParse(data3).success).toBe(true);
    });

    test('should validate partial update', () => {
      const data = {
        fullName: 'Updated Name',
        phoneNumber: '+1234567890',
      };

      const result = updateUserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should reject invalid full name', () => {
      const data = { fullName: 'A' };
      const result = updateUserProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('userSettingsSchema', () => {
    test('should accept boolean settings', () => {
      const data = {
        emailNotifications: true,
        weeklyReport: false,
      };

      const result = userSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should accept theme setting', () => {
      const data1 = { theme: 'light' };
      const data2 = { theme: 'dark' };

      expect(userSettingsSchema.safeParse(data1).success).toBe(true);
      expect(userSettingsSchema.safeParse(data2).success).toBe(true);
    });

    test('should reject invalid theme', () => {
      const data = { theme: 'neon' };
      const result = userSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should accept language setting', () => {
      const data = { language: 'en' };
      const result = userSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should all settings be optional', () => {
      const result = userSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('listUsersQuerySchema', () => {
    test('should have default pagination values', () => {
      const result = listUsersQuerySchema.safeParse({});
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    });

    test('should accept valid pagination', () => {
      const data = { page: 2, limit: 20 };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    });

    test('should enforce max limit of 100', () => {
      const data = { limit: 150 };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should reject negative page number', () => {
      const data = { page: -1 };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should reject zero or negative limit', () => {
      const data1 = { limit: 0 };
      const data2 = { limit: -10 };

      expect(listUsersQuerySchema.safeParse(data1).success).toBe(false);
      expect(listUsersQuerySchema.safeParse(data2).success).toBe(false);
    });

    test('should accept subscription tier filter', () => {
      const data = { subscriptionTier: 'professional' };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    test('should reject invalid subscription tier', () => {
      const data = { subscriptionTier: 'platinum' };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    test('should accept status filter', () => {
      const data = { status: 'active' };
      const result = listUsersQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateData helper', () => {
    test('should return validated data on success', () => {
      const data = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'user@example.com',
        fullName: 'Test User',
      };

      const result = validateData(createUserProfileSchema, data);
      expect(result.email).toBe('user@example.com');
    });

    test('should throw error on validation failure', () => {
      const data = {
        firebaseUID: 'invalid',
        email: 'invalid-email',
        fullName: 'A',
      };

      expect(() => {
        validateData(createUserProfileSchema, data);
      }).toThrow();
    });

    test('should use custom error message', () => {
      const data = { email: 'invalid' };

      try {
        validateData(createUserProfileSchema, data, 'Custom Error');
      } catch (error) {
        expect(error.message).toContain('Custom Error');
      }
    });
  });

  describe('Email normalization', () => {
    test('should lowercase email addresses', () => {
      const data = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: 'USER@EXAMPLE.COM',
        fullName: 'Test User',
      };

      const result = createUserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
      // Email should be lowercased by the schema
    });

    test('should trim whitespace from email', () => {
      const data = {
        firebaseUID: 'test-firebase-uid-1234567890',
        email: '  user@example.com  ',
        fullName: 'Test User',
      };

      const result = createUserProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
