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
const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

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
export const createUserProfileSchema = z.object({
  firebaseUID: firebaseUidSchema,
  email: emailSchema,
  fullName: fullNameSchema,
  phoneNumber: phoneNumberSchema,
  avatarUrl: urlSchema,
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileSchema>;

/**
 * Update User Profile Schema
 * User can update their profile information
 */
export const updateUserProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  avatarUrl: urlSchema.optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

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

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

/**
 * Subscription Update Schema
 * Admin/Backend updates subscription tier for user
 */
export const updateSubscriptionSchema = z.object({
  subscriptionTier: subscriptionTierSchema,
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

/**
 * User Settings Schema
 * Optional user preferences
 */
export const userSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  language: z.string().length(2).optional(), // e.g., 'en', 'es'
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

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

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/**
 * Stripe Customer Schema
 * For storing Stripe customer mapping
 */
export const stripeCustomerSchema = z.object({
  stripeCustomerId: z.string().startsWith('cus_', 'Invalid Stripe customer ID'),
  lastSyncedAt: z.string().datetime(),
});

export type StripeCustomerInput = z.infer<typeof stripeCustomerSchema>;

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

export default {
  createUserProfileSchema,
  updateUserProfileSchema,
  userProfileResponseSchema,
  updateSubscriptionSchema,
  userSettingsSchema,
  listUsersQuerySchema,
  stripeCustomerSchema,
  validateData,
};
