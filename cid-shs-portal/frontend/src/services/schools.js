import api from './api';

/**
 * Get all schools with optional search and filtering
 */
export const getAllSchools = async (params = {}) => {
  const res = await api.get('/schools', { params });
  return res.data;
};

/**
 * Get a single school by ID
 */
export const getSchoolById = async (id) => {
  const res = await api.get(`/schools/${id}`);
  return res.data;
};

/**
 * Create a new school record
 */
export const createSchool = async (data) => {
  const res = await api.post('/schools', data);
  return res.data;
};

/**
 * Update a school record
 */
export const updateSchool = async (id, data) => {
  const res = await api.put(`/schools/${id}`, data);
  return res.data;
};

/**
 * Delete a school record
 */
export const deleteSchool = async (id) => {
  const res = await api.delete(`/schools/${id}`);
  return res.data;
};
