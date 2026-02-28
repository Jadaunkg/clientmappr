import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const searchLeads = async ({
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  sort_order = 'desc',
  ...filters
} = {}) => {
  const payload = {
    page,
    limit,
    sort_by,
    sort_order,
    ...filters,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  const response = await axios.post(`${API_URL}/leads/search`, payload, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return {
    leads: response.data?.data?.leads || [],
    pagination: response.data?.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    meta: response.data?.meta || {},
  };
};

export const searchMyLeads = async ({
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  sort_order = 'desc',
  ...filters
} = {}) => {
  const payload = {
    page,
    limit,
    sort_by,
    sort_order,
    ...filters,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  const response = await axios.post(`${API_URL}/leads/my/search`, payload, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return {
    leads: response.data?.data?.leads || [],
    pagination: response.data?.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
    meta: response.data?.meta || {},
  };
};

export const discoverLeads = async ({
  city,
  business_category,
  limit = 60,
}) => {
  const response = await axios.post(`${API_URL}/leads/discover`, {
    city,
    business_category,
    limit,
  }, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data?.data;
};

export const getLeadDiscoveryStatus = async (runId) => {
  const response = await axios.get(`${API_URL}/leads/discover/${runId}/status`, {
    headers: {
      ...getAuthHeaders(),
    },
  });

  return response.data?.data;
};

export const getLeadDiscoveryResults = async (runId, { page = 1, limit = 60 } = {}) => {
  const response = await axios.get(`${API_URL}/leads/discover/${runId}/results`, {
    params: {
      page,
      limit,
    },
    headers: {
      ...getAuthHeaders(),
    },
  });

  return {
    run: response.data?.data?.run,
    leads: response.data?.data?.leads || [],
    pagination: response.data?.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };
};

export const getMyStats = async () => {
  const response = await axios.get(`${API_URL}/leads/my/stats`, {
    headers: { ...getAuthHeaders() },
  });
  return response.data?.data || {
    totalRuns: 0,
    todayRuns: 0,
    totalLeads: 0,
    leadsNoWebsite: 0,
  };
};

export const exportMyLeads = async ({
  sort_by = 'created_at',
  sort_order = 'desc',
  ...filters
} = {}) => {
  const payload = {
    sort_by,
    sort_order,
    ...filters,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === '' || payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  const response = await axios.post(`${API_URL}/leads/my/export`, payload, {
    headers: { ...getAuthHeaders() },
  });

  return response.data?.data?.leads || [];
};

export const getMyFilterOptions = async () => {
  const response = await axios.get(`${API_URL}/leads/my/filter-options`, {
    headers: { ...getAuthHeaders() },
  });
  return response.data?.data || { cities: [], categories: [] };
};

export default {
  searchLeads,
  searchMyLeads,
  discoverLeads,
  getLeadDiscoveryStatus,
  getLeadDiscoveryResults,
  getMyStats,
  exportMyLeads,
  getMyFilterOptions,
};
