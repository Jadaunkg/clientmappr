import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '12h';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '30d';

const parseTtlToMs = (ttl) => {
  if (typeof ttl === 'number') {
    return ttl * 1000;
  }

  if (typeof ttl !== 'string') {
    return 0;
  }

  const trimmed = ttl.trim();
  const match = trimmed.match(/^(\d+)([smhd])$/i);

  if (!match) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric * 1000 : 0;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit] || 0;

  return value * multiplier;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET is not configured', 500, 'JWT_SECRET_MISSING');
  }

  return process.env.JWT_SECRET;
};

export const generateTokens = (userId) => {
  const nowMs = Date.now();
  const secret = getJwtSecret();

  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    secret,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    secret,
    { expiresIn: REFRESH_TOKEN_TTL },
  );

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    accessTokenExpiresInMs: parseTtlToMs(ACCESS_TOKEN_TTL),
    accessTokenExpiresAt: nowMs + parseTtlToMs(ACCESS_TOKEN_TTL),
  };
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (!decoded?.sub || decoded?.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    return {
      userId: decoded.sub,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Invalid or expired refresh token', 401, 'REFRESH_TOKEN_EXPIRED');
  }
};

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (!decoded?.sub || decoded?.type !== 'access') {
      throw new AppError('Invalid access token', 401, 'INVALID_ACCESS_TOKEN');
    }

    return {
      userId: decoded.sub,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Invalid or expired access token', 401, 'ACCESS_TOKEN_EXPIRED');
  }
};

export default {
  generateTokens,
  verifyRefreshToken,
  verifyAccessToken,
};
