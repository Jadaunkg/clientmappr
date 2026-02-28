/**
 * OAuth Routes
 * Google and LinkedIn OAuth authentication endpoints
 * Handles: initialization, callbacks, token refresh
 */

import express from 'express';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';
import {
  generateGoogleAuthUrl,
  handleGoogleCallback,
  generateLinkedInAuthUrl,
  handleLinkedInCallback,
} from '../services/oauthService.js';

const router = express.Router();

/**
 * GET /api/v1/auth/google
 * Initiate Google OAuth flow
 * Redirect user to Google login
 */
router.get('/google', (req, res) => {
  try {
    // Validate Google OAuth configuration
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.error('Google OAuth credentials not configured');
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          message: 'Google OAuth is not configured. Please contact the administrator.',
          code: 'GOOGLE_CONFIG_MISSING',
        },
        meta: {
          timestamp: Date.now(),
        },
      });
    }

    logger.info('Initiating Google OAuth flow');
    const authUrl = generateGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating Google OAuth:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Failed to initiate Google authentication',
        code: 'GOOGLE_AUTH_INIT_FAILED',
      },
      meta: {
        timestamp: Date.now(),
      },
    });
  }
});

/**
 * GET /api/v1/auth/google/callback
 * Handle Google OAuth callback
 * Exchange authorization code for user tokens
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error, error_description } = req.query;

    logger.info('Processing Google OAuth callback', { hasCode: !!code, error });

    // Check for OAuth errors
    if (error) {
      logger.warn('Google OAuth error:', { error, error_description });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=google_oauth_failed&description=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      logger.error('No authorization code provided by Google');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=google_oauth_failed&description=No authorization code`
      );
    }

    // Handle OAuth callback
    const result = await handleGoogleCallback(code);

    logger.info('Google OAuth successful', { userId: result.user.id });

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with access token
    // Redirect to login page (not dashboard) so OAuth data can be parsed before ProtectedRoute checks
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/login?token=${result.accessToken}&refreshToken=${encodeURIComponent(result.refreshToken)}&accessTokenExpiresAt=${result.accessTokenExpiresAt}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    logger.info('Redirecting to frontend after successful Google OAuth', { redirectUrl: frontendUrl });
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Error handling Google OAuth callback:', error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMessage = error instanceof AppError ? error.message : 'Authentication failed';
    res.redirect(
      `${frontendUrl}/login?error=google_oauth_failed&description=${encodeURIComponent(errorMessage)}`
    );
  }
});

/**
 * GET /api/v1/auth/linkedin
 * Initiate LinkedIn OAuth flow
 */
router.get('/linkedin', (req, res) => {
  try {
    // Validate LinkedIn OAuth configuration
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      logger.error('LinkedIn OAuth credentials not configured');
      return res.status(500).json({
        success: false,
        data: null,
        error: {
          message: 'LinkedIn OAuth is not configured. Please contact the administrator.',
          code: 'LINKEDIN_CONFIG_MISSING',
        },
        meta: {
          timestamp: Date.now(),
        },
      });
    }

    logger.info('Initiating LinkedIn OAuth flow');
    const authUrl = generateLinkedInAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating LinkedIn OAuth:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: {
        message: 'Failed to initiate LinkedIn authentication',
        code: 'LINKEDIN_AUTH_INIT_FAILED',
      },
      meta: {
        timestamp: Date.now(),
      },
    });
  }
});

/**
 * GET /api/v1/auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, error, error_description, state } = req.query;

    logger.info('Processing LinkedIn OAuth callback', { hasCode: !!code, error });

    // Check for OAuth errors
    if (error) {
      logger.warn('LinkedIn OAuth error:', { error, error_description });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=linkedin_oauth_failed&description=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      logger.error('No authorization code provided by LinkedIn');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/login?error=linkedin_oauth_failed&description=No authorization code`
      );
    }

    // Handle OAuth callback
    const result = await handleLinkedInCallback(code, state);

    logger.info('LinkedIn OAuth successful', { userId: result.user.id });

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with access token
    // Redirect to login page (not dashboard) so OAuth data can be parsed before ProtectedRoute checks
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/login?token=${result.accessToken}&refreshToken=${encodeURIComponent(result.refreshToken)}&accessTokenExpiresAt=${result.accessTokenExpiresAt}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    logger.info('Redirecting to frontend after successful LinkedIn OAuth', { redirectUrl: frontendUrl });
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Error handling LinkedIn OAuth callback:', error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMessage = error instanceof AppError ? error.message : 'Authentication failed';
    res.redirect(
      `${frontendUrl}/login?error=linkedin_oauth_failed&description=${encodeURIComponent(errorMessage)}`
    );
  }
});

export default router;
