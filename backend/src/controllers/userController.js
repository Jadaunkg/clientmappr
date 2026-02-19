/**
 * User Controller
 * Route handlers for user profile endpoints
 * All endpoints require Firebase authentication
 */

import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';
import {
  createUserProfileSchema,
  updateUserProfileSchema,
  validateData,
} from '../validators/userValidators.js';
import * as userService from '../services/userService.js';
import { updateLastLogin } from '../services/userService.js';

/**
 * POST /api/v1/users/profile
 * Create user profile after Firebase signup
 * 
 * Request body: {firebaseUID, email, fullName?, phoneNumber?, avatarUrl?}
 * Response: {success, data: userProfile, error, meta}
 */
export async function createUserProfile(req, res, next) {
  try {
    logger.info('Creating user profile', { userId: req.user.uid });

    // Validate request body
    const validatedData = validateData(
      createUserProfileSchema,
      {
        firebaseUID: req.user.uid,
        email: req.user.email,
        fullName: req.body.fullName || req.user.displayName || '',
        phoneNumber: req.body.phoneNumber,
        avatarUrl: req.body.avatarUrl || req.user.photoURL,
      },
      'Invalid user profile data'
    );

    // Check if user already exists
    const exists = await userService.userExists(validatedData.firebaseUID);
    if (exists) {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          message: 'User profile already exists',
          code: 'USER_EXISTS',
        },
        meta: {
          timestamp: Date.now(),
        },
      });
    }

    // Create user profile with Firebase user data
    const userProfile = await userService.createUserProfile({
      uid: validatedData.firebaseUID,
      email: validatedData.email,
      displayName: validatedData.fullName,
      phoneNumber: validatedData.phoneNumber,
      photoURL: validatedData.avatarUrl,
      emailVerified: req.user.emailVerified,
    });

    logger.info('User profile created', { userId: userProfile.id });

    res.status(201).json({
      success: true,
      data: userProfile,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error creating user profile:', error);
    next(error);
  }
}

/**
 * GET /api/v1/users/profile
 * Get authenticated user's profile
 * 
 * Response: {success, data: userProfile, error, meta}
 */
export async function getUserProfile(req, res, next) {
  try {
    logger.debug('Fetching user profile', { userId: req.user.uid });

    const userProfile = await userService.getUserProfile(req.user.uid);

    res.status(200).json({
      success: true,
      data: userProfile,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    next(error);
  }
}

/**
 * PUT /api/v1/users/profile
 * Update authenticated user's profile
 * 
 * Request body: {fullName?, phoneNumber?, avatarUrl?}
 * Response: {success, data: userProfile, error, meta}
 */
export async function updateUserProfile(req, res, next) {
  try {
    logger.info('Updating user profile', { userId: req.user.uid });

    // Validate request body
    const validatedData = validateData(
      updateUserProfileSchema,
      req.body,
      'Invalid profile update data'
    );

    // Update only provided fields
    const updateData = {};
    if (validatedData.fullName) updateData.full_name = validatedData.fullName;
    if (validatedData.phoneNumber !== undefined) updateData.phone_number = validatedData.phoneNumber;
    if (validatedData.avatarUrl !== undefined) updateData.avatar_url = validatedData.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'No fields to update',
          code: 'NO_UPDATE_FIELDS',
        },
        meta: {
          timestamp: Date.now(),
        },
      });
    }

    const updatedProfile = await userService.updateUserProfile(req.user.uid, updateData);

    logger.info('User profile updated', { userId: req.user.uid });

    res.status(200).json({
      success: true,
      data: updatedProfile,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    next(error);
  }
}

/**
 * GET /api/v1/users/subscription
 * Get user's subscription information
 * 
 * Response: {success, data: subscription, error, meta}
 */
export async function getUserSubscription(req, res, next) {
  try {
    logger.debug('Fetching user subscription', { userId: req.user.uid });

    const subscription = await userService.getUserSubscription(req.user.uid);

    res.status(200).json({
      success: true,
      data: subscription,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching user subscription:', error);
    next(error);
  }
}

/**
 * GET /api/v1/users/stats
 * Get user's account statistics
 * 
 * Response: {success, data: stats, error, meta}
 */
export async function getUserStats(req, res, next) {
  try {
    logger.debug('Fetching user statistics', { userId: req.user.uid });

    const stats = await userService.getUserStats(req.user.uid);

    res.status(200).json({
      success: true,
      data: stats,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    next(error);
  }
}

/**
 * POST /api/v1/users/logout
 * Handle user logout
 * 
 * Response: {success, data: null, error, meta}
 */
export async function logout(req, res, next) {
  try {
    logger.info('User logout', { userId: req.user.uid });

    // Could add logout tracking/cleanup here
    // For now, Firebase handles session invalidation on client

    res.status(200).json({
      success: true,
      data: null,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error during logout:', error);
    next(error);
  }
}

/**
 * DELETE /api/v1/users/account
 * Delete user's account (soft delete)
 * WARNING: This is permanent
 * 
 * Response: {success, data: null, error, meta}
 */
export async function deleteAccount(req, res, next) {
  try {
    logger.warn('User requesting account deletion', { userId: req.user.uid });

    // Optional: Require password or confirmation
    await userService.deleteUserAccount(req.user.uid);

    logger.info('User account deleted', { userId: req.user.uid });

    res.status(200).json({
      success: true,
      data: null,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error deleting account:', error);
    next(error);
  }
}

/**
 * POST /api/v1/auth/signup-callback
 * Called after Firebase signup to create user profile
 * This is the callback endpoint after Firebase signup succeeds
 * 
 * Request body: {fullName?, phoneNumber?}
 * Response: {success, data: userProfile, error, meta}
 */
export async function signupCallback(req, res, next) {
  try {
    logger.info('Processing signup callback', { userId: req.user.uid, email: req.user.email });

    // Update last login
    await updateLastLogin(req.user.uid);

    // Check if user profile already exists
    const exists = await userService.userExists(req.user.uid);

    if (exists) {
      // Profile already created, just return it
      const userProfile = await userService.getUserProfile(req.user.uid);
      return res.status(200).json({
        success: true,
        data: { userProfile, isNewUser: false },
        error: null,
        meta: {
          timestamp: Date.now(),
        },
      });
    }

    // Create new user profile
    const userProfile = await userService.createUserProfile({
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.body.fullName || req.user.displayName || '',
      phoneNumber: req.body.phoneNumber,
      photoURL: req.user.photoURL,
      emailVerified: req.user.emailVerified,
    });

    logger.info('New user profile created from signup', { userId: userProfile.id });

    res.status(201).json({
      success: true,
      data: { userProfile, isNewUser: true },
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error in signup callback:', error);
    next(error);
  }
}

/**
 * POST /api/v1/auth/signup
 * Email/password signup endpoint
 * Creates user account for email/password authentication
 * 
 * Request body: {email, password, fullName}
 * Response: {success, data: {user, accessToken, refreshToken}, error, meta}
 */
export async function signup(req, res, next) {
  try {
    const { email, password, fullName } = req.body;

    logger.info('Signup attempt', { email });

    // Validate input 
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Email, password, and fullName are required',
          code: 'INVALID_INPUT',
        },
        meta: { timestamp: Date.now() },
      });
    }

    // Create user account
    const user = await userService.createUserAccount({ email, displayName: fullName });

    logger.info('User account created successfully', { userId: user.id, email });

    // Generate response with tokens
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          photoURL: user.avatar_url,
        },
        // Return mock tokens - in production use JWT library
        accessToken: `token_${user.id}_${Date.now()}`,
        refreshToken: `refresh_${user.id}_${Date.now()}`,
      },
      error: null,
      meta: { timestamp: Date.now() },
    });
  } catch (error) {
    logger.error('Error during signup:', error);
    
    // Handle specific errors
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          message: error.message || 'Email already registered',
          code: 'EMAIL_EXISTS',
        },
        meta: { timestamp: Date.now() },
      });
    }

    next(error);
  }
}

/**
 * POST /api/v1/auth/login-callback
 * Authenticate user with email and password
 * Returns JWT access token and refresh token
 * 
 * Request body: {email, password}
 * Response: {success, data: {accessToken, refreshToken, user}, error, meta}
 */
export async function loginCallback(req, res, next) {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Email and password are required',
          code: 'INVALID_INPUT',
        },
        meta: { timestamp: Date.now() },
      });
    }

    // Get user from Supabase by email
    const user = await userService.getUserByEmail(email);

    if (!user) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        },
        meta: { timestamp: Date.now() },
      });
    }

    // For now, skip password validation (MVP mode)
    // In production, validate against stored password hash with bcryptjs
    logger.info('User login successful', { userId: user.id, email });

    // Update last login
    await updateLastLogin(user.id);

    // Generate simple response with user data
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          photoURL: user.avatar_url,
        },
        // Return mock tokens - in production use JWT library
        accessToken: `token_${user.id}_${Date.now()}`,
        refreshToken: `refresh_${user.id}_${Date.now()}`,
      },
      error: null,
      meta: { timestamp: Date.now() },
    });
  } catch (error) {
    logger.error('Error in login callback:', error);
    next(error);
  }
}

// All functions exported as named exports above
// Use: import * as userController from './userController.js'
// Usage: userController.loginCallback(...)
