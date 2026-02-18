/**
 * User Routes
 * API endpoints for user profile management
 * All endpoints require Firebase authentication (except signup-callback with valid token)
 */

import express from 'express';
import { firebaseAuthMiddleware, requireOwner, requireSubscription } from '../middleware/firebaseAuth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

/**
 * POST /api/v1/auth/signup-callback
 * Create user profile after Firebase signup
 * Requires valid Firebase token in Authorization header
 */
router.post('/auth/signup-callback', firebaseAuthMiddleware, userController.signupCallback);

/**
 * GET /api/v1/users/profile
 * Get authenticated user's profile
 * Requires: Auth token
 */
router.get('/users/profile', firebaseAuthMiddleware, userController.getUserProfile);

/**
 * PUT /api/v1/users/profile
 * Update authenticated user's profile
 * Requires: Auth token
 * Body: {fullName?, phoneNumber?, avatarUrl?}
 */
router.put('/users/profile', firebaseAuthMiddleware, userController.updateUserProfile);

/**
 * GET /api/v1/users/subscription
 * Get user's subscription information
 * Requires: Auth token
 */
router.get('/users/subscription', firebaseAuthMiddleware, userController.getUserSubscription);

/**
 * GET /api/v1/users/stats
 * Get user's account statistics
 * Requires: Auth token
 */
router.get('/users/stats', firebaseAuthMiddleware, userController.getUserStats);

/**
 * POST /api/v1/users/logout
 * Handle user logout
 * Requires: Auth token
 */
router.post('/users/logout', firebaseAuthMiddleware, userController.logout);

/**
 * DELETE /api/v1/users/account
 * Delete user's account (soft delete)
 * WARNING: This is permanent
 * Requires: Auth token
 */
router.delete('/users/account', firebaseAuthMiddleware, userController.deleteAccount);

export default router;
