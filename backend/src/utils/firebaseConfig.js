/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase for backend authentication and token verification
 * 
 * Firebase Auth is used for:
 * - User authentication (signup, login, email verification)
 * - OAuth integration (Google, LinkedIn via Firebase)
 * - Password reset and email verification flows
 * - MFA capability (optional)
 * 
 * Supabase is used for:
 * - Data persistence (leads, subscriptions, interactions, exports)
 * - Row-level security (RLS) policies
 * - Real-time updates (optional)
 */

import admin from 'firebase-admin';
import logger from './logger.js';

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 * Must be called once at application startup
 * 
 * Environment variables required:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 */
export const initializeFirebase = () => {
  try {
    if (firebaseApp) {
      logger.info('Firebase already initialized');
      return firebaseApp;
    }

    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth} Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin.auth(firebaseApp);
};

/**
 * Verify Firebase ID token
 * @param {string} token - The Firebase ID token to verify
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token with user claims
 * @throws {Error} If token is invalid or verification fails
 */
export const verifyFirebaseToken = async (token) => {
  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    logger.error('Firebase token verification failed:', error);
    throw new Error('Invalid or expired authentication token');
  }
};

/**
 * Get Firebase user by UID
 * @param {string} uid - Firebase User ID
 * @returns {Promise<admin.auth.UserRecord>} User record from Firebase
 */
export const getFirebaseUser = async (uid) => {
  try {
    const auth = getFirebaseAuth();
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    logger.error(`Failed to get Firebase user ${uid}:`, error);
    throw error;
  }
};

/**
 * Create custom claims for a user
 * Custom claims can be used in Supabase RLS policies
 * 
 * @param {string} uid - Firebase User ID
 * @param {object} customClaims - Claims to set (e.g., { role: 'admin', subscription: 'pro' })
 * @returns {Promise<void>}
 */
export const setCustomClaims = async (uid, customClaims) => {
  try {
    const auth = getFirebaseAuth();
    await auth.setCustomUserClaims(uid, customClaims);
    logger.info(`Custom claims set for user ${uid}:`, customClaims);
  } catch (error) {
    logger.error(`Failed to set custom claims for user ${uid}:`, error);
    throw error;
  }
};

/**
 * Create a custom token for testing/development
 * Should NOT be used in production for authentication
 * 
 * @param {string} uid - Firebase User ID
 * @param {object} additionalClaims - Optional additional claims
 * @returns {Promise<string>} Custom authentication token
 */
export const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const auth = getFirebaseAuth();
    const token = await auth.createCustomToken(uid, additionalClaims);
    return token;
  } catch (error) {
    logger.error('Failed to create custom token:', error);
    throw error;
  }
};

export default {
  initializeFirebase,
  getFirebaseAuth,
  verifyFirebaseToken,
  getFirebaseUser,
  setCustomClaims,
  createCustomToken,
};
