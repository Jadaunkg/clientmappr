import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { isRedisConfigured } from '../config/redis.js';
import { enqueueLeadDiscoveryJob, getLeadDiscoveryJobStatus } from '../jobs/leadIngestionQueue.js';
import { runLeadIngestionFlow } from './pipeline/leadIngestionFlow.js';
import {
  createDiscoveryRun,
  attachJobToDiscoveryRun,
  markDiscoveryRunCompleted,
  markDiscoveryRunFailed,
  markDiscoveryRunRunning,
  getDiscoveryRunById,
  getDiscoveryRunWithLeads,
  countTodayDiscoveryRuns,
  getUserSubscriptionTier,
  getUserDiscoveredLeads,
} from './leads/leadDiscoveryRepository.js';

const TIER_DAILY_DISCOVERY_LIMIT = {
  free_trial: 5,
  starter: 25,
  professional: 100,
  enterprise: 500,
};

// Allow all tiers to fetch up to 60 leads per run (3 pages × 20 from Google API)
const TIER_MAX_RESULTS_PER_DISCOVERY = {
  free_trial: 60,
  starter: 60,
  professional: 120,
  enterprise: 200,
};

const containsValue = (value, target) => {
  if (!value || !target) {
    return false;
  }

  return String(value).toLowerCase().includes(String(target).toLowerCase());
};

const applyResultFilters = ({ leads, city, businessCategory, requestedLimit }) => {
  const filtered = (leads || []).filter((lead) => {
    // If city exists in the lead, check it matches the search city (case-insensitive).
    // If lead.city is EMPTY/NULL we keep the lead — it was still found in the right area.
    const cityMatch = !city
      || !lead.city  // blank city → don't filter out
      || containsValue(lead.city, city)
      || containsValue(lead.address, city);

    // Same logic for business category — blank is a pass
    const categoryMatch = !businessCategory
      || !lead.business_category
      || containsValue(lead.business_category, businessCategory);

    return cityMatch && categoryMatch;
  });

  // If requestedLimit is 0 or falsy, return all matched
  return requestedLimit ? filtered.slice(0, requestedLimit) : filtered;
};

const buildDiscoveryQuery = ({ city, businessCategory }) => {
  return `${businessCategory} in ${city}`.trim();
};

const enforceDiscoveryQuota = async ({ userId }) => {
  const tier = await getUserSubscriptionTier({ userId });
  const todayCount = await countTodayDiscoveryRuns({ userId });
  const dailyLimit = TIER_DAILY_DISCOVERY_LIMIT[tier] || TIER_DAILY_DISCOVERY_LIMIT.free_trial;

  if (todayCount >= dailyLimit) {
    throw new AppError(
      `Daily discovery limit reached for your ${tier} plan (${dailyLimit}/day)`,
      429,
      'DISCOVERY_DAILY_LIMIT_REACHED',
    );
  }

  return {
    tier,
    todayCount,
    dailyLimit,
    maxResultsPerDiscovery: TIER_MAX_RESULTS_PER_DISCOVERY[tier] || TIER_MAX_RESULTS_PER_DISCOVERY.free_trial,
  };
};

const processDiscoveryRunResult = async ({ run, result }) => {
  const filteredLeads = applyResultFilters({
    leads: result.persistedRows || [],
    city: run.city,
    businessCategory: run.business_category,
    requestedLimit: run.requested_limit,
  });

  await markDiscoveryRunCompleted({
    runId: run.id,
    discoveredCount: filteredLeads.length,
    persistedCount: result.persistedCount || filteredLeads.length,
    qualityMeta: result.qualityMeta || null,
    leads: filteredLeads,
  });
};

export const startLeadDiscovery = async ({ userId, city, businessCategory, limit = 60 }) => {
  const quota = await enforceDiscoveryQuota({ userId });
  const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), quota.maxResultsPerDiscovery);
  const query = buildDiscoveryQuery({ city, businessCategory });

  const run = await createDiscoveryRun({
    userId,
    query,
    city,
    businessCategory,
    requestedLimit: safeLimit,
  });

  if (!isRedisConfigured()) {
    logger.warn('REDIS_URL not configured; processing discovery synchronously', { runId: run.id });
    await markDiscoveryRunRunning(run.id);

    try {
      const result = await runLeadIngestionFlow({ query, limit: safeLimit });
      await processDiscoveryRunResult({ run, result });
    } catch (error) {
      await markDiscoveryRunFailed({ runId: run.id, message: error.message });
      throw error;
    }

    return {
      runId: run.id,
      jobId: null,
      queued: false,
      quota,
    };
  }

  const jobId = await enqueueLeadDiscoveryJob({
    query,
  });

  await attachJobToDiscoveryRun({ runId: run.id, jobId });

  return {
    runId: run.id,
    jobId,
    queued: true,
    quota,
  };
};

export const syncDiscoveryRunWithQueue = async ({ runId, userId }) => {
  const run = await getDiscoveryRunById({ runId, userId });

  if (!run.job_id || ['completed', 'failed'].includes(run.status)) {
    return run;
  }

  const queueStatus = await getLeadDiscoveryJobStatus(run.job_id);

  if (queueStatus.state === 'active' && run.status !== 'running') {
    await markDiscoveryRunRunning(run.id);
  }

  if (queueStatus.state === 'completed' && queueStatus.result) {
    await processDiscoveryRunResult({ run, result: queueStatus.result });
  }

  if (queueStatus.state === 'failed') {
    await markDiscoveryRunFailed({
      runId: run.id,
      message: queueStatus.failedReason || 'Discovery job failed',
    });
  }

  return getDiscoveryRunById({ runId, userId });
};

export const getLeadDiscoveryStatus = async ({ runId, userId }) => {
  const run = await syncDiscoveryRunWithQueue({ runId, userId });

  return {
    id: run.id,
    status: run.status,
    jobId: run.job_id,
    provider: run.provider,
    query: run.query,
    city: run.city,
    businessCategory: run.business_category,
    hasWebsite: run.has_website,
    requestedLimit: run.requested_limit,
    discoveredCount: run.discovered_count,
    persistedCount: run.persisted_count,
    errorMessage: run.error_message,
    startedAt: run.started_at,
    completedAt: run.completed_at,
    createdAt: run.created_at,
  };
};

export const getLeadDiscoveryResults = async ({ runId, userId, page = 1, limit = 20 }) => {
  await syncDiscoveryRunWithQueue({ runId, userId });
  const data = await getDiscoveryRunWithLeads({ runId, userId, page, limit });

  return {
    run: data.run,
    leads: data.leads,
    pagination: data.pagination,
  };
};

export const getMyDiscoveredLeads = async ({
  userId,
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const data = await getUserDiscoveredLeads({
    userId,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  return {
    leads: data.leads,
    pagination: data.pagination,
  };
};

export default {
  startLeadDiscovery,
  getLeadDiscoveryStatus,
  getLeadDiscoveryResults,
  syncDiscoveryRunWithQueue,
  getMyDiscoveredLeads,
};
