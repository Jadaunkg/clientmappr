import express from 'express';
import {
  listLeads,
  getLeadDetails,
  searchLeadsWithFilters,
  enrichLead,
  updateLeadStatus,
  softDeleteLead,
  discoverLeads,
  getLeadDiscoveryRunStatus,
  getLeadDiscoveryRunResults,
  getMyLeads,
  getMyLeadsStats,
  exportMyLeads,
  getMyLeadsFilterOptions,
} from '../controllers/leadsController.js';
import { firebaseAuthMiddleware, requireSubscription } from '../middleware/firebaseAuth.js';
import { googleMapsRateLimitMiddleware } from '../middleware/googleMapsRateLimit.js';

const router = express.Router();

router.get('/leads', listLeads);
router.get('/leads/:id', getLeadDetails);
router.post('/leads/search', searchLeadsWithFilters);
router.post('/leads/my/search', firebaseAuthMiddleware, getMyLeads);
router.post('/leads/my/export', firebaseAuthMiddleware, exportMyLeads);
router.get('/leads/my/stats', firebaseAuthMiddleware, getMyLeadsStats);
router.get('/leads/my/filter-options', firebaseAuthMiddleware, getMyLeadsFilterOptions);
router.post('/leads/discover', firebaseAuthMiddleware, discoverLeads);
router.get('/leads/discover/:runId/status', firebaseAuthMiddleware, getLeadDiscoveryRunStatus);
router.get('/leads/discover/:runId/results', firebaseAuthMiddleware, getLeadDiscoveryRunResults);
router.post(
  '/leads/enrich',
  firebaseAuthMiddleware,
  requireSubscription('professional'),
  googleMapsRateLimitMiddleware,
  enrichLead,
);
router.put('/leads/:id/status', firebaseAuthMiddleware, updateLeadStatus);
router.delete('/leads/:id', firebaseAuthMiddleware, softDeleteLead);

export default router;
