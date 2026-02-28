/**
 * User Validation Schemas (Zod)
 * Centralized validation for all user-related endpoints
 * 
 * Usage:
 * const { error, data } = createUserSchema.safeParse(req.body);
 * if (error) throw new AppError(error.message, 400);
 */

import { z } from 'zod';

/**
 * Email validation regex
 * RFC 5322 simplified pattern
 */
const emailSchema = z.string().trim().toLowerCase().email('Invalid email format');

/**
 * Firebase UID validation
 * Firebase UIDs are 28 characters long, alphanumeric
 */
const firebaseUidSchema = z.string().length(28, 'Invalid Firebase UID format');

/**
 * Subscription tier enum
 */
const subscriptionTierSchema = z.enum(['free_trial', 'starter', 'professional', 'enterprise']);

/**
 * User status enum
 */
const userStatusSchema = z.enum(['active', 'suspended', 'deleted']);

/**
 * Full name validation
 * 2-100 characters, no special characters except spaces and hyphens
 */
const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

/**
 * Phone number validation
 * Optional, basic format validation
 */
const phoneNumberSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]{10,}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

/**
 * URL validation
 */
const urlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));

/**
 * Create User Profile Schema (after Firebase signup)
 * Called when new Firebase user is created
 */
/**
 * @typedef {Object} CreateUserProfileInput
 * @property {string} firebaseUID - Firebase UID (28 chars)
 * @property {string} email - User email
 * @property {string} fullName - User's full name
 * @property {string} phoneNumber - User's phone number
 * @property {string} avatarUrl - Avatar URL
 */
export const createUserProfileSchema = z.object({
  firebaseUID: firebaseUidSchema,
  email: emailSchema,
  fullName: fullNameSchema,
  phoneNumber: phoneNumberSchema,
  avatarUrl: urlSchema,
});

/**
 * Update User Profile Schema
 * User can update their profile information
 */
/**
 * @typedef {Object} UpdateUserProfileInput
 * @property {string} [fullName] - User's full name (optional)
 * @property {string} [phoneNumber] - User's phone number (optional)
 * @property {string} [avatarUrl] - Avatar URL (optional)
 */
export const updateUserProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  avatarUrl: urlSchema.optional(),
});

/**
 * Get User Profile Schema (response)
 */
export const userProfileResponseSchema = z.object({
  id: firebaseUidSchema,
  email: emailSchema,
  fullName: z.string(),
  phoneNumber: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  subscriptionTier: subscriptionTierSchema,
  status: userStatusSchema,
  emailVerified: z.boolean(),
  lastLogin: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Type definitions in JSDoc above

/**
 * Subscription Update Schema
 * Admin/Backend updates subscription tier for user
 */
/**
 * @typedef {Object} UpdateSubscriptionInput
 * @property {string} subscriptionTier - New subscription tier
 */
export const updateSubscriptionSchema = z.object({
  subscriptionTier: subscriptionTierSchema,
});

/**
 * User Settings Schema
 * Optional user preferences
 */
/**
 * @typedef {Object} UserSettingsInput
 * @property {boolean} [emailNotifications] - Email notifications toggle
 * @property {boolean} [weeklyReport] - Weekly report toggle
 * @property {string} [theme] - UI theme (light/dark)
 * @property {string} [language] - User language code (2 chars)
 */
export const userSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  language: z.string().length(2).optional(),
});

/**
 * List Users Query Schema (admin endpoint)
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  subscriptionTier: subscriptionTierSchema.optional(),
  status: userStatusSchema.optional(),
  search: z.string().optional(), // Search by email or name
});

// ListUsersQuery type defined in JSDoc above

/**
 * Stripe Customer Schema
 * For storing Stripe customer mapping
 */
export const stripeCustomerSchema = z.object({
  stripeCustomerId: z.string().startsWith('cus_', 'Invalid Stripe customer ID'),
  lastSyncedAt: z.string().datetime(),
});

// StripeCustomerInput type defined in JSDoc above

/**
 * Validation helper function
 * Validates input against schema and throws AppError if invalid
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param errorMessage - Custom error message prefix
 * @returns Validated data
 * @throws AppError if validation fails
 */
export function validateData(schema, data, errorMessage = 'Validation failed') {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    const error = new Error(`${errorMessage}: ${errors}`);
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}

// All schemas and functions exported as named exports above
// Usage: import { createUserProfileSchema, validateData } from './userValidators.js'
