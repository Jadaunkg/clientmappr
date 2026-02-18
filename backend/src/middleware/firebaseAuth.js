/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches user claims to requests
 */

import logger from './logger.js';
import AppError from './AppError.js';
import { extractTokenFromHeader, verifyAndGetUserClaims, logAuthEvent } from './firebaseUtils.js';

/**
 * Middleware to verify Firebase authentication token
 * Expects token in Authorization header: "Bearer <firebase_id_token>"
 * Attaches decoded user claims to req.user
 * 
 * Usage in Express:
 * app.use(firebaseAuthMiddleware);
 * // or
 * app.get('/protected-route', firebaseAuthMiddleware, handler);
 */
export const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next(new AppError('Authentication required', 401));
    }

    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return next(new AppError('Invalid token format. Use: Bearer <token>', 401));
    }

    // Verify Firebase token and get user claims
    const userClaims = await verifyAndGetUserClaims(token);
    
    // Attach user claims to request object
    req.user = userClaims;
    req.firebaseToken = token;
    
    // Log successful authentication
    logAuthEvent('TOKEN_VERIFIED', userClaims.uid, {
      email: userClaims.email,
      provider: userClaims.provider,
    });

    next();
  } catch (error) {
    logger.error('Firebase authentication failed:', error);
    
    if (error.message.includes('token is revoked')) {
      return next(new AppError('Session has been revoked. Please log in again', 401));
    }
    
    if (error.message.includes('auth/id-token-expired')) {
      return next(new AppError('Session expired. Please log in again', 401));
    }

    return next(new AppError('Authentication failed', 401));
  }
};

/**
 * Middleware to optionally verify Firebase token
 * If token is present, verifies it; if absent, continues
 * Useful for endpoints that allow both authenticated and anonymous access
 * 
 * Usage in Express:
 * app.get('/public-route', optionalFirebaseAuth, handler);
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();  // Continue without authentication
    }

    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return next(new AppError('Invalid token format. Use: Bearer <token>', 401));
    }

    // Verify Firebase token
    const userClaims = await verifyAndGetUserClaims(token);
    req.user = userClaims;
    req.firebaseToken = token;

    next();
  } catch (error) {
    logger.error('Optional Firebase authentication failed:', error);
    // Continue without user context on error
    next();
  }
};

/**
 * Middleware to verify user matches requested resource
 * Ensures users can only access their own data
 * 
 * Usage in Express:
 * app.get('/users/:userId/data', firebaseAuthMiddleware, requireOwner, handler);
 * 
 * The route parameter name should be configurable
 */
export const requireOwner = (userIdParamName = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const requestedUserId = req.params[userIdParamName];
      
      if (!requestedUserId) {
        return next(new AppError('Invalid resource ID', 400));
      }

      if (req.user.uid !== requestedUserId) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user.uid,
          attemptedUserId: requestedUserId,
        });
        return next(new AppError('You do not have permission to access this resource', 403));
      }

      next();
    } catch (error) {
      logger.error('Owner verification failed:', error);
      next(new AppError('Authorization check failed', 500));
    }
  };
};

/**
 * Middleware to verify subscription tier
 * Checks custom claims for subscription level
 * 
 * Usage in Express:
 * app.post('/premium-feature', firebaseAuthMiddleware, requireSubscription('professional'), handler);
 */
export const requireSubscription = (minTier = 'starter') => {
  const tierRanking = {
    free_trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      const userTier = req.user.customClaims?.subscription_tier || 'free_trial';
      const requiredRank = tierRanking[minTier] || 0;
      const userRank = tierRanking[userTier] || 0;

      if (userRank < requiredRank) {
        return next(
          new AppError(
            `This feature requires ${minTier} subscription or higher. Your tier: ${userTier}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      logger.error('Subscription verification failed:', error);
      next(new AppError('Subscription check failed', 500));
    }
  };
};

export default {
  firebaseAuthMiddleware,
  optionalFirebaseAuth,
  requireOwner,
  requireSubscription,
};
