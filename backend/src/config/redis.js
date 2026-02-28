import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient;
let connectionPromise;

const REDIS_URL = process.env.REDIS_URL;

const getOrCreateClient = () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy(retries) {
        return Math.min(retries * 100, 2000);
      },
    },
  });

  redisClient.on('error', (error) => {
    logger.error('Redis client error', { message: error.message });
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });

  return redisClient;
};

export const isRedisConfigured = () => Boolean(REDIS_URL);

export const getRedisClient = async () => {
  if (!isRedisConfigured()) {
    throw new Error('REDIS_URL is not configured');
  }

  const client = getOrCreateClient();

  if (client.isOpen) {
    return client;
  }

  if (!connectionPromise) {
    connectionPromise = client.connect()
      .then(() => {
        logger.info('Redis client connected');
      })
      .catch((error) => {
        logger.error('Failed to connect Redis client', { message: error.message });
        throw error;
      })
      .finally(() => {
        connectionPromise = null;
      });
  }

  await connectionPromise;
  return client;
};

export const checkRedisHealth = async () => {
  if (!isRedisConfigured()) {
    return { status: 'NOT_CONFIGURED', details: 'REDIS_URL not set' };
  }

  try {
    const client = await getRedisClient();
    const pong = await client.ping();

    if (pong !== 'PONG') {
      return { status: 'FAILED', details: `Unexpected ping response: ${pong}` };
    }

    return { status: 'OK', details: 'Redis ping successful' };
  } catch (error) {
    return { status: 'FAILED', details: error.message };
  }
};

export const safeRedisQuit = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
};
