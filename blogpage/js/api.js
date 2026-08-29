/* ============================================
   Papertrail — api.js
   Service layer around the Express backend API.
   ============================================ */

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.PAPERTRAIL_CONFIG?.API_BASE_URL) {
    return window.PAPERTRAIL_CONFIG.API_BASE_URL.replace(/\/+$/, '');
  }
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '');
  return isLocal ? 'http://localhost:5000/api' : 'http://localhost:5000/api';
}

const TOKEN_KEY = 'papertrail_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Could not save auth token to localStorage', e);
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Could not clear auth token from localStorage', e);
  }
}

function buildQueryString(params) {
  if (!params) return '';
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (usable.length === 0) return '';
  return '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

/**
 * Core fetch wrapper. Attaches the JWT (if present), parses JSON,
 * and throws an Error with a user-facing `message` on any non-2xx
 * response so callers can catch a single error type.
 */
async function apiRequest(endpoint, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    const error = new Error('Could not reach the server. Please check your internet connection or try again later.');
    error.status = 0;
    throw error;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (parseError) {
    payload = null;
  }

  if (!response.ok) {
    const message = (payload && payload.message) || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;

    if (response.status === 401 && auth) {
      clearToken();
      try {
        localStorage.removeItem('papertrail_current_user');
      } catch (e) {
        // ignore
      }
    }

    throw error;
  }

  return payload;
}

const api = {
  auth: {
    register: (name, email, password) =>
      apiRequest('/auth/register', { method: 'POST', body: { name, email, password }, auth: false }),
    login: (email, password) =>
      apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    me: () => apiRequest('/auth/me')
  },
  blogs: {
    list: (params) => apiRequest(`/blogs${buildQueryString(params)}`, { auth: false }),
    mine: (params) => apiRequest(`/blogs${buildQueryString({ ...params, mine: 'true' })}`),
    get: (id, { trackView } = {}) => apiRequest(`/blogs/${id}${trackView ? '?view=true' : ''}`, { auth: false }),
    create: (data) => apiRequest('/blogs', { method: 'POST', body: data }),
    update: (id, data) => apiRequest(`/blogs/${id}`, { method: 'PUT', body: data }),
    remove: (id) => apiRequest(`/blogs/${id}`, { method: 'DELETE' })
  },
  dashboard: {
    stats: () => apiRequest('/dashboard/stats')
  }
};
