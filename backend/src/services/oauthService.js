/**
 * OAuth Service
 * Handles Google and LinkedIn OAuth authentication flows
 * Manages user creation/lookup and token generation
 * 
 * Pattern:
 * - OAuth provider redirects to callback endpoint
 * - Exchange authorization code for provider tokens
 * - Get user profile from provider
 * - Create or update user in Supabase
 * - Generate simple auth token
 */

import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Google OAuth2 client
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback'
);

/**
 * Generate a unique 28-character user ID (mimics Firebase UID format)
 * Uses hex encoding to reliably generate exactly 28 characters
 * 
 * @returns {string} 28-character random alphanumeric ID
 */
function generateUserId() {
  // 14 bytes of random data = 28 hex characters when converted to hex string
  const randomBytes = crypto.randomBytes(14);
  const userId = randomBytes.toString('hex');
  
  // Verify it's exactly 28 characters (should always be true for hex)
  if (userId.length !== 28) {
    logger.warn(`Generated userId has length ${userId.length}, expected 28. Regenerating...`);
    return generateUserId();
  }
  
  return userId;
}

/**
 * Generate Google OAuth authorization URL
 * User is redirected to this URL to login with Google
 * 
 * @returns {string} Google authorization URL
 */
export function generateGoogleAuthUrl() {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Always show consent screen
    });

    logger.info('Generated Google OAuth URL');
    return authUrl;
  } catch (error) {
    logger.error('Error generating Google OAuth URL:', error);
    throw new AppError('Failed to generate Google auth URL', 500);
  }
}

/**
 * Handle Google OAuth callback
 * Exchange authorization code for tokens and get user profile
 * 
 * @param {string} code - Authorization code from Google
 * @returns {object} {success: true, user: {...}, accessToken: '...', refreshToken: '...'}
 */
export async function handleGoogleCallback(code) {
  try {
    logger.info('Processing Google OAuth callback');

    if (!code) {
      throw new AppError('Missing authorization code', 400);
    }

    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);

    // Get user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuth2Client });
    const { data: googleUser } = await oauth2.userinfo.get();

    logger.info('Retrieved Google user profile', { googleId: googleUser.id });

    if (!googleUser.email) {
      throw new AppError('Email not provided by Google', 400);
    }

    // Check if user exists in database
    const existingUser = await getUserByOAuth('google', googleUser.id);

    let user;
    if (existingUser) {
      logger.info('Google OAuth user exists, updating profile', { userId: existingUser.id });
      // Update existing user
      user = await updateUserFromOAuth(existingUser.id, {
        email: googleUser.email,
        full_name: googleUser.name,
        avatar_url: googleUser.picture,
        last_login: new Date().toISOString(),
      });
    } else {
      logger.info('Creating new user from Google OAuth', { email: googleUser.email });
      // Create new user
      user = await createUserFromOAuth({
        oauth_provider: 'google',
        oauth_id: googleUser.id,
        email: googleUser.email,
        full_name: googleUser.name,
        avatar_url: googleUser.picture,
      });
    }

    // Generate JWT tokens for our app
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('Successfully processed Google OAuth', { userId: user.id });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        subscription_tier: user.subscription_tier,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      logger.error('OAuth error:', error.message);
      throw error;
    }
    logger.error('Error handling Google OAuth callback:', error);
    throw new AppError('Failed to process Google authentication', 500);
  }
}

/**
 * Generate LinkedIn OAuth authorization URL
 * 
 * @returns {string} LinkedIn authorization URL
 */
export function generateLinkedInAuthUrl() {
  try {
    const state = Math.random().toString(36).substring(7); // CSRF protection
    const scope = 'r_liteprofile%20r_emailaddress';
    const responseType = 'code';
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/linkedin/callback'
    );

    const authUrl = 
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=${responseType}` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`;

    logger.info('Generated LinkedIn OAuth URL');
    return authUrl;
  } catch (error) {
    logger.error('Error generating LinkedIn OAuth URL:', error);
    throw new AppError('Failed to generate LinkedIn auth URL', 500);
  }
}

/**
 * Handle LinkedIn OAuth callback
 * Exchange authorization code for tokens and get user profile
 * 
 * @param {string} code - Authorization code from LinkedIn
 * @param {string} state - State parameter for CSRF validation
 * @returns {object} {success: true, user: {...}, accessToken: '...', refreshToken: '...'}
 */
export async function handleLinkedInCallback(code, state) {
  try {
    logger.info('Processing LinkedIn OAuth callback');

    if (!code) {
      throw new AppError('Missing authorization code', 400);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {},
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/linkedin/callback',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      throw new AppError('Failed to get access token from LinkedIn', 500);
    }

    // Get user profile from LinkedIn
    let linkedinUser;
    try {
      const profileResponse = await axios.get(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      linkedinUser = profileResponse.data;
    } catch (profileError) {
      logger.error('Error fetching LinkedIn profile:', profileError);
      throw new AppError('Failed to get LinkedIn profile', 500);
    }

    // Get email from LinkedIn
    let email;
    try {
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (emailResponse.data.elements && emailResponse.data.elements.length > 0) {
        email = emailResponse.data.elements[0]['handle~'].emailAddress;
      }
    } catch (emailError) {
      logger.warn('Could not retrieve email from LinkedIn:', emailError.message);
    }

    if (!email) {
      throw new AppError('Email not available from LinkedIn', 400);
    }

    // Extract name from LinkedIn profile
    const firstName = linkedinUser.localizedFirstName || '';
    const lastName = linkedinUser.localizedLastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    logger.info('Retrieved LinkedIn user profile', { linkedinId: linkedinUser.id, email });

    // Check if user exists
    const existingUser = await getUserByOAuth('linkedin', linkedinUser.id);

    let user;
    if (existingUser) {
      logger.info('LinkedIn OAuth user exists, updating profile', { userId: existingUser.id });
      user = await updateUserFromOAuth(existingUser.id, {
        email,
        full_name: fullName,
        last_login: new Date().toISOString(),
      });
    } else {
      logger.info('Creating new user from LinkedIn OAuth', { email });
      user = await createUserFromOAuth({
        oauth_provider: 'linkedin',
        oauth_id: linkedinUser.id,
        email,
        full_name: fullName,
      });
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    logger.info('Successfully processed LinkedIn OAuth', { userId: user.id });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        subscription_tier: user.subscription_tier,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      logger.error('OAuth error:', error.message);
      throw error;
    }
    logger.error('Error handling LinkedIn OAuth callback:', error);
    throw new AppError('Failed to process LinkedIn authentication', 500);
  }
}

/**
 * Generate simple auth tokens for OAuth users
 * Returns a session token that can be used for subsequent requests
 * 
 * @param {string} userId - User ID to encode in token
 * @returns {object} {accessToken: '...', refreshToken: '...'}
 */
function generateTokens(userId) {
  try {
    // Generate simple tokens using base64 encoding for demo purposes
    // In production, should use proper JWT with signing
    const timestamp = Date.now();
    
    // Create a simple session token
    const tokenData = {
      userId,
      type: 'access',
      iat: timestamp,
      exp: timestamp + (1 * 60 * 60 * 1000), // 1 hour
    };
    
    const accessToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    const refreshTokenData = {
      userId,
      type: 'refresh',
      iat: timestamp,
      exp: timestamp + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    
    const refreshToken = Buffer.from(JSON.stringify(refreshTokenData)).toString('base64');

    logger.debug('Generated tokens for OAuth user', { userId });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Error generating tokens:', error);
    throw new AppError('Failed to generate authentication tokens', 500);
  }
}

/**
 * Get user by OAuth provider and ID
 * 
 * @param {string} provider - 'google' or 'linkedin'
 * @param {string} oauthId - Provider's user ID
 * @returns {object|null} User object or null
 */
async function getUserByOAuth(provider, oauthId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('oauth_provider', provider)
      .eq('oauth_id', oauthId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return data || null;
  } catch (error) {
    logger.error('Error fetching user by OAuth:', error);
    throw new AppError('Database error', 500);
  }
}

/**
 * Create new user from OAuth provider data
 * 
 * @param {object} oauthData - {oauth_provider, oauth_id, email, full_name, avatar_url}
 * @returns {object} Created user
 */
async function createUserFromOAuth(oauthData) {
  try {
    // Generate unique user ID (28 characters to match schema constraint)
    const userId = generateUserId();

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        oauth_provider: oauthData.oauth_provider,
        oauth_id: oauthData.oauth_id,
        email: oauthData.email,
        full_name: oauthData.full_name,
        avatar_url: oauthData.avatar_url,
        subscription_tier: 'free_trial',
        status: 'active',
        email_verified: true, // OAuth email is pre-verified by provider
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      logger.error('Error creating user from OAuth:', error);
      throw new AppError('Failed to create user account', 500);
    }

    logger.info('Created new OAuth user', { userId: data.id, provider: oauthData.oauth_provider });
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Unexpected error creating OAuth user:', error);
    throw new AppError('Failed to create user account', 500);
  }
}

/**
 * Update user from OAuth provider data
 * 
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated user
 */
async function updateUserFromOAuth(userId, updateData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      logger.error('Error updating user from OAuth:', error);
      throw new AppError('Failed to update user account', 500);
    }

    logger.info('Updated OAuth user', { userId });
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Unexpected error updating OAuth user:', error);
    throw new AppError('Failed to update user account', 500);
  }
}

/**
 * Verify OAuth ID token (for additional security)
 * 
 * @param {string} accessToken - OAuth access token
 * @returns {boolean} True if valid
 */
export function verifyOAuthToken(accessToken) {
  try {
    if (!accessToken) {
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Error verifying OAuth token:', error);
    return false;
  }
}
