import googleMapsScraper from '../leads/googleMapsScraper.js';
import leadRepository from '../leads/leadRepository.js';
import {
  normalizeLeadRecord,
  deriveLeadMetadata,
  cleanLeadRecord,
  validateLeadRecord,
  deduplicateLeadBatch,
  enrichLeadRecord,
} from './leadPipeline.js';

const defaultDependencies = {
  scraper: googleMapsScraper,
  repository: leadRepository,
};

export const fetchStage = async (payload, dependencies = defaultDependencies) => {
  const query = payload?.query;
  const limit = payload?.limit || 60;
  const rawLeads = await dependencies.scraper.fetchPlacesByText({ query, maxResults: limit });
  return {
    query,
    rawLeads,
    sourceUpdatedAt: new Date().toISOString(),
  };
};

export const cleanStage = async (payload) => {
  const rawLeads = payload?.rawLeads || [];

  const normalizedLeads = rawLeads.map((lead) => normalizeLeadRecord(lead));
  const dedupedLeads = deduplicateLeadBatch(normalizedLeads);

  const validLeads = [];
  const rejectedLeads = [];

  dedupedLeads.forEach((lead) => {
    const cleaned = cleanLeadRecord(lead);
    const validation = validateLeadRecord(cleaned);

    if (!validation.isValid) {
      rejectedLeads.push({ lead: cleaned, errors: validation.errors });
      return;
    }

    validLeads.push(cleaned);
  });

  return {
    ...payload,
    validLeads,
    rejectedLeads,
    qualityMeta: {
      inputCount: rawLeads.length,
      dedupedCount: dedupedLeads.length,
      validCount: validLeads.length,
      rejectedCount: rejectedLeads.length,
    },
  };
};

export const enrichStage = async (payload) => {
  const nowIso = new Date().toISOString();

  const enrichedLeads = payload.validLeads.map((lead) => {
    const metadata = deriveLeadMetadata(lead);
    return enrichLeadRecord(lead, {
      ...metadata,
      source_updated_at: payload.sourceUpdatedAt || nowIso,
      last_synced_at: nowIso,
      status: 'enriched',
    });
  });

  return {
    ...payload,
    enrichedLeads,
  };
};

export const persistStage = async (payload, dependencies = defaultDependencies) => {
  const persistenceResult = await dependencies.repository.upsertLeads(payload.enrichedLeads);

  return {
    ...payload,
    persistenceResult,
  };
};

export const runLeadIngestionFlow = async (payload, dependencies = defaultDependencies) => {
  const fetched = await fetchStage(payload, dependencies);
  const cleaned = await cleanStage(fetched);
  const enriched = await enrichStage(cleaned);
  const persisted = await persistStage(enriched, dependencies);

  return {
    query: persisted.query,
    qualityMeta: persisted.qualityMeta,
    persistedCount: persisted.persistenceResult.persistedCount,
    rejectedCount: persisted.rejectedLeads.length,
    persistedRows: persisted.persistenceResult.rows || [],
  };
};

export default {
  fetchStage,
  cleanStage,
  enrichStage,
  persistStage,
  runLeadIngestionFlow,
};
