import api from './api';

/**
 * Get all audit logs with optional search and filtering
 */
export const getAllAuditLogs = async (params = {}) => {
  const res = await api.get('/audit-logs', { params });
  return res.data;
};
