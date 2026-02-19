/**
 * User Service
 * Business logic for user profile management
 * Integrates Firebase Authentication with Supabase database
 * 
 * Pattern:
 * - All functions async/await
 * - Firebase for authentication
 * - Supabase for data persistence
 * - Custom error handling
 */

import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';
import { formatUserForSupabase } from '../utils/firebaseUtils.js';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Create a new user profile in Supabase after Firebase signup
 * Called from signup callback endpoint
 * 
 * @param {object} firebaseUser - User data from Firebase
 * @param {string} firebaseUser.uid - Firebase user ID
 * @param {string} firebaseUser.email - User email
 * @param {string} firebaseUser.displayName - User's display name (optional)
 * @param {string} firebaseUser.photoURL - User's avatar URL (optional)
 * @param {boolean} firebaseUser.emailVerified - Whether email is verified
 * 
 * @returns {Promise<object>} Created user profile
 * @throws {AppError} If user already exists or database error
 */
export async function createUserProfile(firebaseUser) {
  try {
    // Format user data for Supabase
    const userData = formatUserForSupabase(firebaseUser);

    logger.info('Creating user profile in Supabase', {
      userId: firebaseUser.uid,
      email: firebaseUser.email,
    });

    // Insert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      // Check if user already exists
      if (error.code === '23505') {
        // Unique constraint violation
        logger.warn('User already exists', { email: firebaseUser.email });
        throw new AppError('User account already exists', 409);
      }
      throw error;
    }

    if (!data) {
      throw new AppError('Failed to create user profile', 500);
    }

    logger.info('User profile created successfully', { userId: data.id });
    return data;
  } catch (error) {
    logger.error('Error creating user profile:', error);
    if (error.statusCode) throw error; // Re-throw AppError
    throw new AppError('Failed to create user profile', 500);
  }
}

/**
 * Get user profile by Firebase UID
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<object>} User profile data
 * @throws {AppError} If user not found
 */
export async function getUserProfile(firebaseUid) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', firebaseUid)
      .single();

    if (error || !data) {
      logger.warn('User profile not found', { userId: firebaseUid });
      throw new AppError('User profile not found', 404);
    }

    return data;
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to fetch user profile', 500);
  }
}

/**
 * Update user profile
 * Only user can update their own profile
 * 
 * @param {string} firebaseUid - Firebase user ID (must match requesting user)
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated user profile
 * @throws {AppError} If user not found or update fails
 */
export async function updateUserProfile(firebaseUid, updateData) {
  try {
    logger.info('Updating user profile', { userId: firebaseUid, fields: Object.keys(updateData) });

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', firebaseUid)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Failed to update user profile', 500);
    }

    logger.info('User profile updated successfully', { userId: data.id });
    return data;
  } catch (error) {
    logger.error('Error updating user profile:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to update user profile', 500);
  }
}

/**
 * Update user's last login timestamp
 * Called after successful Firebase authentication
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<void>}
 */
export async function updateLastLogin(firebaseUid) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', firebaseUid);

    if (error) {
      logger.error('Error updating last login:', error);
      // Don't throw - this is non-critical
      return;
    }

    logger.debug('Last login updated', { userId: firebaseUid });
  } catch (error) {
    logger.error('Error updating last login:', error);
    // Silent fail - non-critical operation
  }
}

/**
 * Update user subscription tier
 * Only backend/admin can call this
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @param {string} newTier - New subscription tier
 * @returns {Promise<object>} Updated user
 */
export async function updateSubscriptionTier(firebaseUid, newTier) {
  try {
    logger.info('Updating subscription tier', { userId: firebaseUid, newTier });

    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', firebaseUid)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Failed to update subscription', 500);
    }

    logger.info('Subscription tier updated', { userId: firebaseUid, newTier });
    return data;
  } catch (error) {
    logger.error('Error updating subscription tier:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to update subscription', 500);
  }
}

/**
 * Suspend user account
 * Only admin can call this
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @param {string} reason - Reason for suspension
 * @returns {Promise<object>} Updated user
 */
export async function suspendUser(firebaseUid, reason = 'Account suspended') {
  try {
    logger.warn('Suspending user account', { userId: firebaseUid, reason });

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', firebaseUid)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Failed to suspend user', 500);
    }

    logger.info('User suspended', { userId: firebaseUid });
    return data;
  } catch (error) {
    logger.error('Error suspending user:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to suspend user', 500);
  }
}

/**
 * Check if user profile exists
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<boolean>} True if user exists
 */
export async function userExists(firebaseUid) {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('id', firebaseUid);

    return !error && count > 0;
  } catch (error) {
    logger.error('Error checking if user exists:', error);
    return false;
  }
}

/**
 * Get user subscription information
 * Includes from users table
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<object>} User subscription info
 */
export async function getUserSubscription(firebaseUid) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, subscription_tier, status, created_at, updated_at')
      .eq('id', firebaseUid)
      .single();

    if (error || !data) {
      throw new AppError('User subscription not found', 404);
    }

    return data;
  } catch (error) {
    logger.error('Error fetching user subscription:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to fetch user subscription', 500);
  }
}

/**
 * List all users (admin only)
 * Paginated and filterable
 * 
 * @param {object} options - Query options
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Items per page
 * @param {string} options.subscriptionTier - Filter by tier
 * @param {string} options.status - Filter by status
 * @param {string} options.search - Search by email or name
 * 
 * @returns {Promise<object>} Paginated users list
 */
export async function listUsers(options = {}) {
  try {
    const { page = 1, limit = 10, subscriptionTier, status, search } = options;
    const offset = (page - 1) * limit;

    logger.debug('Listing users', { page, limit, subscriptionTier, status });

    let query = supabase.from('users').select('*');

    // Apply filters
    if (subscriptionTier) {
      query = query.eq('subscription_tier', subscriptionTier);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      // Search by email or full_name
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Get total count
    const { count, error: countError } = await query;
    if (countError) throw countError;

    // Get paginated results
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      items: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error) {
    logger.error('Error listing users:', error);
    throw new AppError('Failed to list users', 500);
  }
}

/**
 * Delete user account
 * Hard delete - removes all user data
 * WARNING: This is permanent
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<void>}
 */
export async function deleteUserAccount(firebaseUid) {
  try {
    logger.warn('Deleting user account', { userId: firebaseUid });

    // Soft delete instead of hard delete (set status to 'deleted')
    const { error } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', firebaseUid);

    if (error) {
      throw new AppError('Failed to delete user account', 500);
    }

    logger.info('User account deleted', { userId: firebaseUid });
  } catch (error) {
    logger.error('Error deleting user account:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to delete user account', 500);
  }
}

/**
 * Get user statistics
 * Returns aggregate stats about user
 * 
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Promise<object>} User statistics
 */
export async function getUserStats(firebaseUid) {
  try {
    logger.debug('Fetching user statistics', { userId: firebaseUid });

    // Get user profile
    const userProfile = await getUserProfile(firebaseUid);

    // Count interactions
    const { count: interactionCount } = await supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', firebaseUid);

    // Count exports
    const { count: exportCount } = await supabase
      .from('exports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', firebaseUid)
      .eq('status', 'completed');

    return {
      userId: firebaseUid,
      email: userProfile.email,
      subscriptionTier: userProfile.subscription_tier,
      totalInteractions: interactionCount || 0,
      totalExports: exportCount || 0,
      accountAge: Math.floor((Date.now() - new Date(userProfile.created_at)) / (1000 * 60 * 60 * 24)), // days
      lastLogin: userProfile.last_login,
    };
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to fetch user statistics', 500);
  }
}

/**
 * Get user by email for login/authentication
 * 
 * @param {string} email - User email address
 * @returns {Promise<object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching user by email:', error);
    if (error.code === 'PGRST116') return null; // Expected: no rows
    throw new AppError('Failed to fetch user', 500);
  }
}

/**
 * Create user account with email and password
 * For email/password signup flow
 * 
 * @param {string} email - User email
 * @param {string} displayName - User's display name
 * @returns {Promise<object>} Created user object
 */
export async function createUserAccount({ email, displayName = '' }) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Generate a unique user ID (for email/password users without Firebase)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        full_name: displayName,
        subscription_tier: 'free_trial',
        status: 'active',
        email_verified: false,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating user account:', error);
      if (error.code === '23505') {
        // Unique constraint violation
        throw new AppError('Email already registered', 409);
      }
      throw new AppError('Failed to create user account', 500);
    }

    logger.info('User account created', { userId: data.id, email });
    return data;
  } catch (error) {
    logger.error('Error creating user account:', error);
    if (error.statusCode) throw error;
    throw new AppError('Failed to create user account', 500);
  }
}

// All functions exported as named exports above
// Use: import * as userService from './userService.js'
