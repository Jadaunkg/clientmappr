import AppError from '../utils/AppError.js';
import { getRedisClient, isRedisConfigured } from '../config/redis.js';

const DEFAULT_LIMIT = Number(process.env.GOOGLE_MAPS_RATE_LIMIT_PER_MINUTE || 20);
const DEFAULT_WINDOW_MS = Number(process.env.GOOGLE_MAPS_RATE_LIMIT_WINDOW_MS || 60_000);

const inMemoryBuckets = new Map();

const getClientId = (req) => {
  return req.user?.uid || req.ip || 'anonymous';
};

const buildWindowKey = (clientId, windowMs, nowMs = Date.now()) => {
  const windowIndex = Math.floor(nowMs / windowMs);
  return {
    key: `ratelimit:googlemaps:enrich:${clientId}:${windowIndex}`,
    resetAt: (windowIndex + 1) * windowMs,
  };
};

export const consumeInMemoryRateLimit = ({
  clientId,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
  nowMs = Date.now(),
}) => {
  const { key, resetAt } = buildWindowKey(clientId, windowMs, nowMs);
  const existing = inMemoryBuckets.get(key);

  if (!existing || existing.resetAt <= nowMs) {
    inMemoryBuckets.set(key, { count: 1, resetAt });
  } else {
    existing.count += 1;
    inMemoryBuckets.set(key, existing);
  }

  const bucket = inMemoryBuckets.get(key);

  return {
    allowed: bucket.count <= limit,
    count: bucket.count,
    limit,
    resetAt: bucket.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((bucket.resetAt - nowMs) / 1000), 0),
  };
};

const consumeRedisRateLimit = async ({
  clientId,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
  nowMs = Date.now(),
}) => {
  const redis = await getRedisClient();
  const { key, resetAt } = buildWindowKey(clientId, windowMs, nowMs);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.pexpire(key, windowMs);
  }

  return {
    allowed: count <= limit,
    count,
    limit,
    resetAt,
    retryAfterSeconds: Math.max(Math.ceil((resetAt - nowMs) / 1000), 0),
  };
};

export const googleMapsRateLimitMiddleware = async (req, res, next) => {
  try {
    const clientId = getClientId(req);
    const rateResult = isRedisConfigured()
      ? await consumeRedisRateLimit({ clientId })
      : consumeInMemoryRateLimit({ clientId });

    res.setHeader('X-RateLimit-Limit', String(rateResult.limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(rateResult.limit - rateResult.count, 0)));
    res.setHeader('X-RateLimit-Reset', String(rateResult.resetAt));

    if (!rateResult.allowed) {
      return next(new AppError(
        'Google Maps enrichment rate limit exceeded. Please retry later.',
        429,
        'GOOGLE_MAPS_RATE_LIMIT_EXCEEDED',
      ));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default {
  googleMapsRateLimitMiddleware,
  consumeInMemoryRateLimit,
};
