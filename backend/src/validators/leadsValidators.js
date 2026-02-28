import { z } from 'zod';

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? value : numberValue;
};

const toOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
};

const filterSchema = z.object({
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  business_category: z.string().min(1).max(100).optional(),
  status: z.enum(['new', 'validated', 'enriched', 'archived']).optional(),
  has_website: z.preprocess(toOptionalBoolean, z.boolean().optional()),
  has_phone: z.preprocess(toOptionalBoolean, z.boolean().optional()),
  business_status: z.enum(['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']).optional(),
  price_level: z.enum([
    'PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE',
    'PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE',
  ]).optional(),
  min_rating: z.preprocess(toOptionalNumber, z.number().min(0).max(5).optional()),
  max_rating: z.preprocess(toOptionalNumber, z.number().min(0).max(5).optional()),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
}).strict();

const paginationSchema = z.object({
  page: z.preprocess(toOptionalNumber, z.number().int().positive().default(1)),
  limit: z.preprocess(toOptionalNumber, z.number().int().positive().max(200).default(60)),
});

const sortSchema = z.object({
  sort_by: z.enum(['created_at', 'business_name', 'google_rating', 'review_count', 'city', 'state']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const listInputSchema = paginationSchema.merge(sortSchema).merge(filterSchema);

const normalizeValidationError = (error) => {
  return error.errors.map((item) => `${item.path.join('.')}: ${item.message}`).join(', ');
};

export const parseLeadListInput = (input) => {
  const result = listInputSchema.safeParse(input || {});

  if (!result.success) {
    const error = new Error(`Invalid lead search input: ${normalizeValidationError(result.error)}`);
    error.statusCode = 400;
    throw error;
  }

  const {
    page,
    limit,
    sort_by,
    sort_order,
    ...filters
  } = result.data;

  if (filters.min_rating !== undefined && filters.max_rating !== undefined && filters.min_rating > filters.max_rating) {
    const error = new Error('Invalid lead search input: min_rating cannot be greater than max_rating');
    error.statusCode = 400;
    throw error;
  }

  return {
    page,
    limit,
    sortBy: sort_by,
    sortOrder: sort_order,
    filters,
  };
};

const statusUpdateSchema = z.object({
  status: z.enum(['new', 'validated', 'enriched', 'archived']),
}).strict();

export const parseLeadStatusUpdateInput = (input) => {
  const result = statusUpdateSchema.safeParse(input || {});

  if (!result.success) {
    const error = new Error(`Invalid lead status payload: ${normalizeValidationError(result.error)}`);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

const enrichInputSchema = z.object({
  leadId: z.string().uuid(),
  forceRefresh: z.boolean().optional().default(false),
}).strict();

const discoverInputSchema = z.object({
  city: z.string().min(2).max(100),
  business_category: z.string().min(2).max(100),
  limit: z.preprocess(toOptionalNumber, z.number().int().positive().max(200).optional().default(60)),
}).strict();

const discoverStatusQuerySchema = z.object({
  page: z.preprocess(toOptionalNumber, z.number().int().positive().default(1)),
  limit: z.preprocess(toOptionalNumber, z.number().int().positive().max(200).default(60)),
});

export const parseLeadEnrichInput = (input) => {
  const result = enrichInputSchema.safeParse(input || {});

  if (!result.success) {
    const error = new Error(`Invalid lead enrich payload: ${normalizeValidationError(result.error)}`);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

export const parseLeadDiscoverInput = (input) => {
  const result = discoverInputSchema.safeParse(input || {});

  if (!result.success) {
    const error = new Error(`Invalid lead discover payload: ${normalizeValidationError(result.error)}`);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

export const parseLeadDiscoverResultQuery = (input) => {
  const result = discoverStatusQuerySchema.safeParse(input || {});

  if (!result.success) {
    const error = new Error(`Invalid discovery result query: ${normalizeValidationError(result.error)}`);
    error.statusCode = 400;
    throw error;
  }

  return result.data;
};

export default {
  parseLeadListInput,
  parseLeadStatusUpdateInput,
  parseLeadEnrichInput,
  parseLeadDiscoverInput,
  parseLeadDiscoverResultQuery,
};
