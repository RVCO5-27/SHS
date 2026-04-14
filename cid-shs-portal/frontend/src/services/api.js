import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL;
if (baseURL) {
  baseURL = String(baseURL).replace(/\/$/, '');
  if (!baseURL.endsWith('/api')) baseURL = `${baseURL}/api`;
} else if (import.meta.env.DEV) {
  // Same-origin /api — Vite proxies to the backend (see vite.config.js)
  baseURL = '/api';
} else {
  const origin = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '');
  baseURL = `${origin}/api`;
}

const api = axios.create({
  baseURL,
  // Removed default Content-Type to let Axios handle FormData correctly
});

// Attach JWT automatically when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const code = err.response?.data?.code;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (code === 'MUST_CHANGE_PASSWORD' && path && !path.includes('/admin/change-password')) {
      window.location.assign(`${window.location.origin}/admin/change-password`);
    }
    return Promise.reject(err);
  }
);

export default api;

/**
 * Resolves a file path to a full URL
 * @param {string} path - The path to resolve (e.g. /uploads/filename.png)
 * @returns {string} - The full URL
 */
export const resolveFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Ensure the path starts with /uploads/ for consistency
  let normalizedPath = path;
  if (!normalizedPath.startsWith('/uploads/') && !normalizedPath.startsWith('uploads/')) {
    normalizedPath = `/uploads/${normalizedPath.replace(/^\//, '')}`;
  } else if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  
  // In dev, we rely on the Vite proxy for /uploads
  if (import.meta.env.DEV) {
    return normalizedPath;
  }
  
  // In production, use the API origin
  const origin = (import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000').replace(/\/$/, '');
  return `${origin}${normalizedPath}`;
};

// Export helper to set token programmatically (useful for tests)
export const setToken = (t) => { if (t) localStorage.setItem('token', t); else localStorage.removeItem('token'); };
