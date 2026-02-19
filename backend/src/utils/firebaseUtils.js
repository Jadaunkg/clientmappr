/**
 * Firebase Utility Functions
 * Helper functions for Firebase Authentication integration with Supabase
 */

import logger from './logger.js';
import { verifyFirebaseToken } from './firebaseConfig.js';

/**
 * Extract Firebase token from Authorization header
 * Expected format: "Bearer <token>"
 * 
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Firebase token or null if invalid format
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Verify Firebase token and extract user claims
 * Used in middleware to authenticate requests
 * 
 * @param {string} token - Firebase ID token
 * @returns {Promise<object>} User claims including uid, email, email_verified, etc.
 * @throws {Error} If token is invalid or verification fails
 */
export const verifyAndGetUserClaims = async (token) => {
  try {
    const decodedToken = await verifyFirebaseToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      provider: decodedToken.firebase?.identities ? Object.keys(decodedToken.firebase.identities)[0] : 'password',
      customClaims: decodedToken.customClaims || {},
    };
  } catch (error) {
    logger.error('Failed to verify Firebase token:', error);
    throw error;
  }
};

/**
 * Format user data for Supabase insertion
 * Maps Firebase user data to Supabase users table schema
 * 
 * @param {object} firebaseUser - User data from Firebase
 * @returns {object} Formatted user object for Supabase
 */
export const formatUserForSupabase = (firebaseUser) => {
  return {
    id: firebaseUser.uid,  // Firebase UID is primary key
    email: firebaseUser.email,
    full_name: firebaseUser.displayName || '',
    phone_number: firebaseUser.phoneNumber || '',
    avatar_url: firebaseUser.photoURL || '',
    subscription_tier: 'free_trial',
    status: 'active',
    email_verified: firebaseUser.emailVerified || false,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/**
 * Build Supabase authorization header with Firebase token
 * Used for including authentication in Supabase client queries
 * 
 * @param {string} firebaseToken - Firebase ID token
 * @returns {object} Authorization header object
 */
export const buildSupabaseAuthHeader = (firebaseToken) => {
  return {
    Authorization: `Bearer ${firebaseToken}`,
  };
};

/**
 * Extract user ID from Firebase token claims
 * Useful for logging and tracing requests
 * 
 * @param {string} firebaseToken - Firebase ID token
 * @returns {Promise<string>} Firebase UID
 */
export const getUserIdFromToken = async (firebaseToken) => {
  try {
    const claims = await verifyAndGetUserClaims(firebaseToken);
    return claims.uid;
  } catch (error) {
    logger.error('Failed to extract user ID from token:', error);
    throw error;
  }
};

/**
 * Check if user has specific subscription tier
 * Used for feature access control
 * 
 * @param {object} userClaims - User claims from Firebase token
 * @param {string} requiredTier - Required subscription tier ('free_trial', 'starter', 'professional', 'enterprise')
 * @returns {boolean} Whether user has required tier or higher
 */
export const hasSubscriptionTier = (userClaims, requiredTier) => {
  const tierRanking = {
    free_trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };

  const userTier = userClaims.customClaims?.subscription_tier || 'free_trial';
  const requiredRank = tierRanking[requiredTier] || 0;
  const userRank = tierRanking[userTier] || 0;

  return userRank >= requiredRank;
};

/**
 * Log authentication event
 * Useful for debugging and audit trails
 * 
 * @param {string} eventType - Type of auth event (LOGIN, SIGNUP, LOGOUT, TOKEN_REFRESH, etc.)
 * @param {string} uid - Firebase User ID
 * @param {object} additionalData - Extra data to log
 */
export const logAuthEvent = (eventType, uid, additionalData = {}) => {
  logger.info(`AUTH_EVENT: ${eventType}`, {
    uid,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};


// All functions exported as named exports above
// Use: import { functionName } from './firebaseUtils.js'
