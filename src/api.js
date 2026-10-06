import axios from 'axios';

// The React app only ever talks to the LavaLust API - never to the database.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const STORAGE_KEY = 'pms_session';

/* ---------------------------------------------------------------- session */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ------------------------------------------------------------ axios setup */
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.tokens?.access_token) {
    config.headers.Authorization = `Bearer ${session.tokens.access_token}`;
  }
  return config;
});

// If the access token expired (15 min) try ONE refresh, then repeat the request.
let refreshing = null;

function refreshTokens(refreshToken) {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => {
        const session = loadSession();
        const next = { ...session, tokens: res.data.tokens };
        saveSession(next);
        return next.tokens.access_token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const session = loadSession();
    const isAuthCall = original?.url?.includes('/api/auth/');

    if (error.response?.status === 401 && !original._retry && !isAuthCall && session?.tokens?.refresh_token) {
      original._retry = true;
      try {
        const newAccess = await refreshTokens(session.tokens.refresh_token);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        clearSession();
        window.dispatchEvent(new Event('auth:logout'));
      }
    } else if (error.response?.status === 401 && !isAuthCall) {
      clearSession();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

/* --------------------------------------------------------------- helpers */
/** Turn any axios error into a readable message (+ per-field errors if any). */
export function parseError(error) {
  const data = error.response?.data;
  if (data?.errors && Object.keys(data.errors).length) {
    return { message: data.error || 'Please fix the highlighted fields.', fields: data.errors };
  }
  if (data?.error) return { message: data.error, fields: {} };
  if (error.code === 'ECONNABORTED') return { message: 'The server took too long to respond.', fields: {} };
  if (!error.response) {
    return { message: `Cannot reach the API at ${API_URL}. Is it running / is CORS set?`, fields: {} };
  }
  return { message: `Something went wrong (HTTP ${error.response.status}).`, fields: {} };
}

/* ------------------------------------------------------------------- API */
export const AuthAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }).then((r) => r.data),
  register: (username, email, password) =>
    api.post('/api/auth/register', { username, email, password }).then((r) => r.data),
  logout: (refreshToken) =>
    api.post('/api/auth/logout', { refresh_token: refreshToken }).then((r) => r.data),
};

export const ProductAPI = {
  list: (params) => api.get('/api/products', { params }).then((r) => r.data),
  create: (data) => api.post('/api/products', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/products/${id}`).then((r) => r.data),
};

export default api;
