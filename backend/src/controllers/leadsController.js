import logger from '../utils/logger.js';
import {
  parseLeadListInput,
  parseLeadStatusUpdateInput,
  parseLeadEnrichInput,
  parseLeadDiscoverInput,
  parseLeadDiscoverResultQuery,
} from '../validators/leadsValidators.js';
import {
  searchLeads,
  getLeadById,
  updateLeadStatusById,
  softDeleteLeadById,
  enrichLeadById,
} from '../services/leadsService.js';
import {
  startLeadDiscovery,
  getLeadDiscoveryStatus,
  getLeadDiscoveryResults,
  getMyDiscoveredLeads,
} from '../services/leadDiscoveryService.js';
import { getUserStats, getUserLeadFilterOptions } from '../services/leads/leadDiscoveryRepository.js';

const sendSearchResponse = (res, result) => {
  return res.status(200).json({
    success: true,
    data: {
      leads: result.leads,
    },
    error: null,
    meta: {
      timestamp: Date.now(),
      cache: result.cache,
      queryPlan: result.queryPlan,
    },
    pagination: result.pagination,
  });
};

export const listLeads = async (req, res, next) => {
  try {
    const parsedInput = parseLeadListInput(req.query);

    const result = await searchLeads(parsedInput);
    return sendSearchResponse(res, result);
  } catch (error) {
    logger.error('Error listing leads', { message: error.message });
    return next(error);
  }
};

export const searchLeadsWithFilters = async (req, res, next) => {
  try {
    const parsedInput = parseLeadListInput(req.body);

    const result = await searchLeads(parsedInput);
    return sendSearchResponse(res, result);
  } catch (error) {
    logger.error('Error searching leads', { message: error.message });
    return next(error);
  }
};

export const getLeadDetails = async (req, res, next) => {
  try {
    const lead = await getLeadById(req.params.id);

    return res.status(200).json({
      success: true,
      data: lead,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching lead details', { message: error.message, leadId: req.params.id });
    return next(error);
  }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    const payload = parseLeadStatusUpdateInput(req.body);
    const updatedLead = await updateLeadStatusById(req.params.id, payload.status);

    return res.status(200).json({
      success: true,
      data: updatedLead,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error updating lead status', { message: error.message, leadId: req.params.id });
    return next(error);
  }
};

export const softDeleteLead = async (req, res, next) => {
  try {
    const archivedLead = await softDeleteLeadById(req.params.id);

    return res.status(200).json({
      success: true,
      data: archivedLead,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error soft deleting lead', { message: error.message, leadId: req.params.id });
    return next(error);
  }
};

export const enrichLead = async (req, res, next) => {
  try {
    const payload = parseLeadEnrichInput(req.body);

    const enrichedLead = await enrichLeadById({
      leadId: payload.leadId,
      requestedBy: req.user?.uid || 'unknown',
      forceRefresh: payload.forceRefresh,
    });

    return res.status(200).json({
      success: true,
      data: enrichedLead,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error enriching lead', {
      message: error.message,
      requestedBy: req.user?.uid,
      leadId: req.body?.leadId,
    });
    return next(error);
  }
};

export const discoverLeads = async (req, res, next) => {
  try {
    const parsed = parseLeadDiscoverInput(req.body);
    const userId = req.user?.uid;

    const result = await startLeadDiscovery({
      userId,
      city: parsed.city,
      businessCategory: parsed.business_category,
      limit: parsed.limit,
    });

    return res.status(202).json({
      success: true,
      data: {
        runId: result.runId,
        jobId: result.jobId,
        status: result.queued ? 'queued' : 'completed',
        quota: {
          usedToday: result.quota.todayCount,
          dailyLimit: result.quota.dailyLimit,
          tier: result.quota.tier,
        },
      },
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error discovering leads', { message: error.message, userId: req.user?.uid });
    return next(error);
  }
};

export const getLeadDiscoveryRunStatus = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const runId = req.params.runId;

    const status = await getLeadDiscoveryStatus({ runId, userId });

    return res.status(200).json({
      success: true,
      data: status,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching lead discovery status', { message: error.message, runId: req.params.runId });
    return next(error);
  }
};

export const getLeadDiscoveryRunResults = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const runId = req.params.runId;
    const parsedQuery = parseLeadDiscoverResultQuery(req.query);

    const result = await getLeadDiscoveryResults({
      runId,
      userId,
      page: parsedQuery.page,
      limit: parsedQuery.limit,
    });

    return res.status(200).json({
      success: true,
      data: {
        run: result.run,
        leads: result.leads,
      },
      pagination: result.pagination,
      error: null,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error('Error fetching lead discovery results', { message: error.message, runId: req.params.runId });
    return next(error);
  }
};

export const getMyLeads = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const parsedInput = parseLeadListInput(req.body);

    const result = await getMyDiscoveredLeads({
      userId,
      filters: parsedInput.filters,
      page: parsedInput.page,
      limit: parsedInput.limit,
      sortBy: parsedInput.sortBy,
      sortOrder: parsedInput.sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: {
        leads: result.leads,
      },
      error: null,
      meta: {
        timestamp: Date.now(),
        discoveredOnly: true,
      },
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('Error fetching my discovered leads', { message: error.message, userId: req.user?.uid });
    return next(error);
  }
};

export const exportMyLeads = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const parsedInput = parseLeadListInput(req.body);

    // Fetch ALL matching leads (no pagination) for export — cap at 5000
    const result = await getMyDiscoveredLeads({
      userId,
      filters: parsedInput.filters,
      page: 1,
      limit: 5000,
      sortBy: parsedInput.sortBy,
      sortOrder: parsedInput.sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: {
        leads: result.leads,
      },
      error: null,
      meta: {
        timestamp: Date.now(),
        totalExported: result.leads.length,
      },
    });
  } catch (error) {
    logger.error('Error exporting leads', { message: error.message, userId: req.user?.uid });
    return next(error);
  }
};

export const getMyLeadsStats = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const stats = await getUserStats({ userId });

    return res.status(200).json({
      success: true,
      data: stats,
      error: null,
      meta: { timestamp: Date.now() },
    });
  } catch (error) {
    logger.error('Error fetching my lead stats', { message: error.message, userId: req.user?.uid });
    return next(error);
  }
};

export const getMyLeadsFilterOptions = async (req, res, next) => {
  try {
    const userId = req.user?.uid;
    const options = await getUserLeadFilterOptions({ userId });

    return res.status(200).json({
      success: true,
      data: options,
      error: null,
    });
  } catch (error) {
    logger.error('Error fetching filter options', { message: error.message, userId: req.user?.uid });
    return next(error);
  }
};

export default {
  listLeads,
  searchLeadsWithFilters,
  getLeadDetails,
  updateLeadStatus,
  softDeleteLead,
  enrichLead,
  discoverLeads,
  getLeadDiscoveryRunStatus,
  getLeadDiscoveryRunResults,
  getMyLeads,
  exportMyLeads,
  getMyLeadsFilterOptions,
};
