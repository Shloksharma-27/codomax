/* ============================================
   Papertrail — api.js
   Thin service layer around the Express backend.
   Every network call the frontend makes goes through here.
   ============================================ */

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'papertrail_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    const error = new Error('Could not reach the server. Check your connection and try again.');
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

    if (response.status === 401 && auth) {
      clearToken();
      localStorage.removeItem('papertrail_current_user');
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
