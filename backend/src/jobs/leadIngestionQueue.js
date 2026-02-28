import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import logger from '../utils/logger.js';
import {
  fetchStage,
  cleanStage,
  enrichStage,
  persistStage,
  runLeadIngestionFlow,
} from '../services/pipeline/leadIngestionFlow.js';

const QUEUE_NAMES = {
  discovery: 'lead-discovery-queue',
  fetch: 'lead-fetch-queue',
  clean: 'lead-clean-queue',
  enrich: 'lead-enrich-queue',
  persist: 'lead-persist-queue',
  deadLetter: 'lead-dead-letter-queue',
};

const DEFAULT_ATTEMPTS = Number(process.env.LEAD_PIPELINE_MAX_ATTEMPTS || 3);
const DEFAULT_BACKOFF_MS = Number(process.env.LEAD_PIPELINE_BACKOFF_MS || 2000);
const CONCURRENCY = Number(process.env.LEAD_PIPELINE_CONCURRENCY || 2);

let redisConnection;
let queueContext;

const getRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required for BullMQ queues');
  }

  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  return redisConnection;
};

const createQueue = (name, connection) => {
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: DEFAULT_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_BACKOFF_MS,
      },
      removeOnComplete: 200,
      removeOnFail: 500,
    },
  });
};

const forwardToDeadLetter = async (deadLetterQueue, stage, job, error) => {
  await deadLetterQueue.add('dead-letter', {
    stage,
    failedAt: new Date().toISOString(),
    payload: job?.data,
    message: error.message,
  }, {
    attempts: 1,
    removeOnComplete: true,
  });
};

export const startLeadIngestionQueue = (dependencies = {}) => {
  if (queueContext) {
    return queueContext;
  }

  const connection = getRedisConnection();

  const discoveryQueue = createQueue(QUEUE_NAMES.discovery, connection);
  const fetchQueue = createQueue(QUEUE_NAMES.fetch, connection);
  const cleanQueue = createQueue(QUEUE_NAMES.clean, connection);
  const enrichQueue = createQueue(QUEUE_NAMES.enrich, connection);
  const persistQueue = createQueue(QUEUE_NAMES.persist, connection);
  const deadLetterQueue = createQueue(QUEUE_NAMES.deadLetter, connection);

  const discoveryWorker = new Worker(QUEUE_NAMES.discovery, async (job) => {
    const result = await runLeadIngestionFlow(job.data, {
      ...dependencies,
    });

    return result;
  }, { connection, concurrency: CONCURRENCY });

  const fetchWorker = new Worker(QUEUE_NAMES.fetch, async (job) => {
    const result = await fetchStage(job.data, dependencies);
    await cleanQueue.add('clean-leads', result);
    return result;
  }, { connection, concurrency: CONCURRENCY });

  const cleanWorker = new Worker(QUEUE_NAMES.clean, async (job) => {
    const result = await cleanStage(job.data, dependencies);
    await enrichQueue.add('enrich-leads', result);
    return result;
  }, { connection, concurrency: CONCURRENCY });

  const enrichWorker = new Worker(QUEUE_NAMES.enrich, async (job) => {
    const result = await enrichStage(job.data, dependencies);
    await persistQueue.add('persist-leads', result);
    return result;
  }, { connection, concurrency: CONCURRENCY });

  const persistWorker = new Worker(QUEUE_NAMES.persist, async (job) => {
    const result = await persistStage(job.data, dependencies);
    return result;
  }, { connection, concurrency: CONCURRENCY });

  [
    { worker: discoveryWorker, stage: 'discover' },
    { worker: fetchWorker, stage: 'fetch' },
    { worker: cleanWorker, stage: 'clean' },
    { worker: enrichWorker, stage: 'enrich' },
    { worker: persistWorker, stage: 'persist' },
  ].forEach(({ worker, stage }) => {
    worker.on('failed', async (job, error) => {
      logger.error('Lead pipeline stage failed', { stage, message: error.message });
      try {
        await forwardToDeadLetter(deadLetterQueue, stage, job, error);
      } catch (dlqError) {
        logger.error('Failed to forward job to dead-letter queue', { message: dlqError.message });
      }
    });
  });

  queueContext = {
    queues: {
      discoveryQueue,
      fetchQueue,
      cleanQueue,
      enrichQueue,
      persistQueue,
      deadLetterQueue,
    },
    workers: {
      discoveryWorker,
      fetchWorker,
      cleanWorker,
      enrichWorker,
      persistWorker,
    },
  };

  logger.info('Lead ingestion queue started');
  return queueContext;
};

export const enqueueLeadFetchJob = async (payload) => {
  if (!queueContext) {
    startLeadIngestionQueue();
  }

  const job = await queueContext.queues.fetchQueue.add('fetch-leads', payload);
  return job.id;
};

export const enqueueLeadDiscoveryJob = async (payload) => {
  if (!queueContext) {
    startLeadIngestionQueue();
  }

  const job = await queueContext.queues.discoveryQueue.add('discover-leads', payload);
  return job.id;
};

export const getLeadDiscoveryJobStatus = async (jobId) => {
  if (!queueContext) {
    return {
      state: 'not_found',
      result: null,
      failedReason: null,
    };
  }

  const job = await queueContext.queues.discoveryQueue.getJob(jobId);
  if (!job) {
    return {
      state: 'not_found',
      result: null,
      failedReason: null,
    };
  }

  const state = await job.getState();
  const progress = job.progress || 0;

  return {
    state,
    progress,
    result: job.returnvalue || null,
    failedReason: job.failedReason || null,
  };
};

export const shutdownLeadIngestionQueue = async () => {
  if (!queueContext) {
    return;
  }

  const workers = Object.values(queueContext.workers);
  const queues = Object.values(queueContext.queues);

  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(queues.map((queue) => queue.close()));

  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }

  queueContext = null;
};

export default {
  startLeadIngestionQueue,
  enqueueLeadFetchJob,
  enqueueLeadDiscoveryJob,
  getLeadDiscoveryJobStatus,
  shutdownLeadIngestionQueue,
};
