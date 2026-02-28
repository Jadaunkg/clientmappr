import { createClient } from '@supabase/supabase-js';
import AppError from '../../utils/AppError.js';
import logger from '../../utils/logger.js';

const getSupabaseClient = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new AppError('Supabase is not configured', 500, 'SUPABASE_NOT_CONFIGURED');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
};

export const createDiscoveryRun = async ({
  userId,
  query,
  city,
  businessCategory,
  requestedLimit,
}) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('lead_discovery_runs')
    .insert({
      user_id: userId,
      query,
      city,
      business_category: businessCategory,
      requested_limit: requestedLimit,
      status: 'queued',
      provider: 'google_maps',
    })
    .select('*')
    .single();

  if (error || !data) {
    logger.error('Failed to create lead discovery run', { message: error?.message });
    throw new AppError('Failed to create discovery run', 500, 'DISCOVERY_RUN_CREATE_FAILED');
  }

  return data;
};

export const attachJobToDiscoveryRun = async ({ runId, jobId }) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('lead_discovery_runs')
    .update({ job_id: String(jobId) })
    .eq('id', runId);

  if (error) {
    logger.error('Failed to attach job id to discovery run', { message: error.message, runId, jobId });
    throw new AppError('Failed to attach discovery job', 500, 'DISCOVERY_JOB_ATTACH_FAILED');
  }
};

export const markDiscoveryRunRunning = async (runId) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('lead_discovery_runs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', runId);

  if (error) {
    logger.error('Failed to mark discovery run running', { message: error.message, runId });
  }
};

export const markDiscoveryRunFailed = async ({ runId, message }) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('lead_discovery_runs')
    .update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (error) {
    logger.error('Failed to mark discovery run failed', { message: error.message, runId });
  }
};

export const markDiscoveryRunCompleted = async ({
  runId,
  discoveredCount,
  persistedCount,
  qualityMeta,
  leads,
}) => {
  const supabase = getSupabaseClient();

  const { error: updateError } = await supabase
    .from('lead_discovery_runs')
    .update({
      status: 'completed',
      discovered_count: discoveredCount,
      persisted_count: persistedCount,
      quality_meta: qualityMeta,
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', runId);

  if (updateError) {
    logger.error('Failed to mark discovery run completed', { message: updateError.message, runId });
    throw new AppError('Failed to complete discovery run', 500, 'DISCOVERY_RUN_COMPLETE_FAILED');
  }

  if (!Array.isArray(leads) || !leads.length) {
    return;
  }

  const mappingPayload = leads
    .filter((lead) => lead?.id)
    .map((lead) => ({
      discovery_run_id: runId,
      lead_id: lead.id,
    }));

  if (!mappingPayload.length) {
    return;
  }

  const { error: mappingError } = await supabase
    .from('lead_discovery_leads')
    .upsert(mappingPayload, { onConflict: 'discovery_run_id,lead_id' });

  if (mappingError) {
    logger.error('Failed to map leads to discovery run', { message: mappingError.message, runId });
  }
};

export const getDiscoveryRunById = async ({ runId, userId }) => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('lead_discovery_runs')
    .select('*')
    .eq('id', runId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new AppError('Discovery run not found', 404, 'DISCOVERY_RUN_NOT_FOUND');
  }

  return data;
};

export const getDiscoveryRunWithLeads = async ({ runId, userId, page = 1, limit = 20 }) => {
  const supabase = getSupabaseClient();
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), 200);
  const offset = (safePage - 1) * safeLimit;

  const run = await getDiscoveryRunById({ runId, userId });

  const { data: mappings, error: mappingError, count } = await supabase
    .from('lead_discovery_leads')
    .select('lead_id', { count: 'exact' })
    .eq('discovery_run_id', runId)
    .range(offset, offset + safeLimit - 1);

  if (mappingError) {
    throw new AppError('Failed to fetch discovery results', 500, 'DISCOVERY_RESULTS_FETCH_FAILED');
  }

  const leadIds = (mappings || []).map((row) => row.lead_id);
  let leads = [];

  if (leadIds.length) {
    const { data: leadRows, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds);

    if (leadsError) {
      throw new AppError('Failed to fetch leads for discovery results', 500, 'DISCOVERY_LEADS_FETCH_FAILED');
    }

    const leadMap = new Map((leadRows || []).map((lead) => [lead.id, lead]));
    leads = leadIds.map((leadId) => leadMap.get(leadId)).filter(Boolean);
  }

  return {
    run,
    leads,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: Number(count || 0),
      totalPages: Math.ceil((Number(count || 0) || 0) / safeLimit) || 0,
    },
  };
};

export const countTodayDiscoveryRuns = async ({ userId }) => {
  const supabase = getSupabaseClient();
  const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const { count, error } = await supabase
    .from('lead_discovery_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDayIso);

  if (error) {
    logger.warn('Failed to count today discovery runs', { message: error.message, userId });
    return 0;
  }

  return count || 0;
};

export const getUserSubscriptionTier = async ({ userId }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return 'free_trial';
  }

  return data.subscription_tier || 'free_trial';
};

/**
 * Self-healing repair function.
 * Finds completed discovery runs that have persisted_count > 0 but no rows in
 * lead_discovery_leads (caused by the old city-filter bug that emptied filteredLeads).
 * For each such run, selects leads created within the run's execution window and
 * inserts the missing mappings into lead_discovery_leads.
 */
export const repairOrphanedRunLeadMappings = async ({ userId }) => {
  const supabase = getSupabaseClient();

  // 1. Get all completed runs for this user that have persisted_count > 0
  const { data: completedRuns, error: runsError } = await supabase
    .from('lead_discovery_runs')
    .select('id, started_at, completed_at, persisted_count')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('persisted_count', 0);

  if (runsError || !completedRuns?.length) return;

  // 2. Get which runs already have entries in lead_discovery_leads
  const runIds = completedRuns.map((r) => r.id);
  const { data: existingMappings } = await supabase
    .from('lead_discovery_leads')
    .select('discovery_run_id')
    .in('discovery_run_id', runIds);

  const mappedRunIds = new Set((existingMappings || []).map((m) => m.discovery_run_id));
  const orphanedRuns = completedRuns.filter((r) => !mappedRunIds.has(r.id));

  if (!orphanedRuns.length) return;

  logger.info('Repairing orphaned run lead mappings', { count: orphanedRuns.length, userId });

  for (const run of orphanedRuns) {
    // Use a generous window: from 30s before the run started to 30s after it completed
    const windowStart = new Date(new Date(run.started_at || run.completed_at).getTime() - 30000).toISOString();
    const windowEnd = new Date(new Date(run.completed_at).getTime() + 30000).toISOString();

    const { data: windowLeads } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', windowStart)
      .lte('created_at', windowEnd)
      .eq('source', 'google_maps')
      .limit(200);

    if (!windowLeads?.length) {
      // Fallback: also check updated_at window (for upserted existing leads)
      const { data: updatedLeads } = await supabase
        .from('leads')
        .select('id')
        .gte('updated_at', windowStart)
        .lte('updated_at', windowEnd)
        .eq('source', 'google_maps')
        .limit(200);

      if (!updatedLeads?.length) continue;

      const repairPayload = updatedLeads.map((lead) => ({
        discovery_run_id: run.id,
        lead_id: lead.id,
      }));

      const { error: repairError } = await supabase
        .from('lead_discovery_leads')
        .upsert(repairPayload, { onConflict: 'discovery_run_id,lead_id', ignoreDuplicates: true });

      if (repairError) {
        logger.warn('Repair insert failed (updated_at fallback)', { message: repairError.message, runId: run.id });
      } else {
        logger.info('Repaired orphaned run (updated_at)', { runId: run.id, count: repairPayload.length });
      }
      continue;
    }

    const repairPayload = windowLeads.map((lead) => ({
      discovery_run_id: run.id,
      lead_id: lead.id,
    }));

    const { error: repairError } = await supabase
      .from('lead_discovery_leads')
      .upsert(repairPayload, { onConflict: 'discovery_run_id,lead_id', ignoreDuplicates: true });

    if (repairError) {
      logger.warn('Repair insert failed', { message: repairError.message, runId: run.id });
    } else {
      logger.info('Repaired orphaned run mappings', { runId: run.id, count: repairPayload.length });
    }
  }
};

const applyLeadFilters = (query, filters = {}) => {
  let filteredQuery = query;

  if (filters.city) {
    filteredQuery = filteredQuery.ilike('city', `%${filters.city}%`);
  }

  if (filters.state) {
    filteredQuery = filteredQuery.ilike('state', `%${filters.state}%`);
  }

  if (filters.business_category) {
    filteredQuery = filteredQuery.ilike('business_category', `%${filters.business_category}%`);
  }

  if (filters.status) {
    filteredQuery = filteredQuery.eq('status', filters.status);
  }

  if (filters.has_website !== undefined) {
    filteredQuery = filteredQuery.eq('has_website', filters.has_website);
  }

  // Advanced filters
  if (filters.min_rating !== undefined) {
    filteredQuery = filteredQuery.gte('google_rating', filters.min_rating);
  }

  if (filters.max_rating !== undefined) {
    filteredQuery = filteredQuery.lte('google_rating', filters.max_rating);
  }

  if (filters.business_status) {
    filteredQuery = filteredQuery.eq('business_status', filters.business_status);
  }

  if (filters.has_phone !== undefined) {
    if (filters.has_phone) {
      filteredQuery = filteredQuery.or('phone.neq.,international_phone_number.neq.');
    } else {
      filteredQuery = filteredQuery.is('phone', null).is('international_phone_number', null);
    }
  }

  if (filters.price_level) {
    filteredQuery = filteredQuery.eq('price_level', filters.price_level);
  }

  if (filters.created_after) {
    filteredQuery = filteredQuery.gte('created_at', filters.created_after);
  }

  if (filters.created_before) {
    filteredQuery = filteredQuery.lte('created_at', filters.created_before);
  }

  return filteredQuery;
};

export const getUserDiscoveredLeads = async ({
  userId,
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  // Self-heal: retroactively link leads for runs that lost their lead_discovery_leads entries
  await repairOrphanedRunLeadMappings({ userId }).catch((err) =>
    logger.warn('Repair orphaned leads skipped', { message: err.message }),
  );

  const supabase = getSupabaseClient();
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  // Step 1: Get all completed discovery run IDs belonging to this user
  const { data: userRuns, error: runsError } = await supabase
    .from('lead_discovery_runs')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['completed']);

  if (runsError) {
    throw new AppError('Failed to fetch user discovery runs', 500, 'MY_LEADS_RUNS_FETCH_FAILED');
  }

  const runIds = (userRuns || []).map((r) => r.id);

  if (runIds.length === 0) {
    return {
      leads: [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Step 2: Get unique lead IDs that belong to this user's runs
  const { data: mappings, error: mappingError } = await supabase
    .from('lead_discovery_leads')
    .select('lead_id')
    .in('discovery_run_id', runIds);

  if (mappingError) {
    throw new AppError('Failed to fetch lead mappings', 500, 'MY_LEADS_MAPPING_FETCH_FAILED');
  }

  const uniqueLeadIds = [...new Set((mappings || []).map((m) => m.lead_id).filter(Boolean))];

  if (uniqueLeadIds.length === 0) {
    return {
      leads: [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Step 3: Query leads filtered to only this user's lead IDs, with filters + pagination
  let leadsQuery = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .in('id', uniqueLeadIds);

  leadsQuery = applyLeadFilters(leadsQuery, filters);
  leadsQuery = leadsQuery.order(sortBy, { ascending: sortOrder === 'asc' });
  leadsQuery = leadsQuery.range(offset, offset + safeLimit - 1);

  const { data: leads, error: leadsError, count } = await leadsQuery;

  if (leadsError) {
    throw new AppError('Failed to fetch leads', 500, 'MY_LEADS_FETCH_FAILED');
  }

  const total = Number(count || 0);

  return {
    leads: leads || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 0,
    },
  };
};

export const getUserStats = async ({ userId }) => {
  // Self-heal: fix any orphaned runs before computing stats
  await repairOrphanedRunLeadMappings({ userId }).catch((err) =>
    logger.warn('Stats repair skipped', { message: err.message }),
  );

  const supabase = getSupabaseClient();
  const startOfDayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  // Total discovery runs (all time)
  const { count: totalRuns } = await supabase
    .from('lead_discovery_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Discovery runs today
  const { count: todayRuns } = await supabase
    .from('lead_discovery_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDayIso);

  // Get all completed run IDs for this user
  const { data: completedRuns } = await supabase
    .from('lead_discovery_runs')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const runIds = (completedRuns || []).map((r) => r.id);

  let totalLeads = 0;
  let leadsNoWebsite = 0;

  if (runIds.length) {
    // Count total discovered leads
    const { count: leadsCount } = await supabase
      .from('lead_discovery_leads')
      .select('lead_id', { count: 'exact', head: true })
      .in('discovery_run_id', runIds);

    totalLeads = leadsCount || 0;

    // Get unique lead IDs to count no-website leads
    const { data: mappings } = await supabase
      .from('lead_discovery_leads')
      .select('lead_id')
      .in('discovery_run_id', runIds);

    const uniqueLeadIds = [...new Set((mappings || []).map((m) => m.lead_id).filter(Boolean))];

    if (uniqueLeadIds.length) {
      const { count: noWebCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('id', uniqueLeadIds)
        .eq('has_website', false);

      leadsNoWebsite = noWebCount || 0;
    }
  }

  return {
    totalRuns: totalRuns || 0,
    todayRuns: todayRuns || 0,
    totalLeads,
    leadsNoWebsite,
  };
};

/**
 * Get distinct filter option values from this user's discovery runs.
 * Returns sorted arrays of unique cities and categories the user has searched for.
 */
export const getUserLeadFilterOptions = async ({ userId }) => {
  const supabase = getSupabaseClient();

  // Get all completed runs for this user to extract the search criteria
  const { data: runs } = await supabase
    .from('lead_discovery_runs')
    .select('city, business_category')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const citySet = new Set();
  const categorySet = new Set();

  (runs || []).forEach((run) => {
    if (run.city) citySet.add(run.city.trim());
    if (run.business_category) categorySet.add(run.business_category.trim());
  });

  const sort = (arr) => [...arr].sort((a, b) => a.localeCompare(b));

  return {
    cities: sort(citySet),
    categories: sort(categorySet),
  };
};

export default {
  createDiscoveryRun,
  attachJobToDiscoveryRun,
  markDiscoveryRunRunning,
  markDiscoveryRunFailed,
  markDiscoveryRunCompleted,
  getDiscoveryRunById,
  getDiscoveryRunWithLeads,
  countTodayDiscoveryRuns,
  getUserSubscriptionTier,
  getUserDiscoveredLeads,
  getUserStats,
  getUserLeadFilterOptions,
  repairOrphanedRunLeadMappings,
};
