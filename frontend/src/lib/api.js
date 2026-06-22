// Tiny fetch wrapper for the Masterpiece API. Always uses REACT_APP_BACKEND_URL + /api prefix.
const BASE = process.env.REACT_APP_BACKEND_URL;

if (!BASE) {
  // Fail fast so the developer notices the missing env var early.
  // eslint-disable-next-line no-console
  console.error('REACT_APP_BACKEND_URL is not set; backend calls will fail.');
}

const tokenKey = 'mpt_owner_jwt';

export const setToken = (t) => { try { localStorage.setItem(tokenKey, t); } catch (e) { /* ignore */ } };
export const getToken = () => { try { return localStorage.getItem(tokenKey); } catch (e) { return null; } };
export const clearToken = () => { try { localStorage.removeItem(tokenKey); } catch (e) { /* ignore */ } };

const request = async (method, path, { body, auth = false, signal } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
  }
  if (!res.ok) {
    const err = new Error(data?.detail || data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const api = {
  // Public
  health: () => request('GET', '/health'),
  getSettings: () => request('GET', '/settings'),
  submitQuote: (payload) => request('POST', '/quotes', { body: payload }),

  // Admin
  adminLogin: (email, password) => request('POST', '/admin/auth/login', { body: { email, password } }),
  adminVerify: (email, code) => request('POST', '/admin/auth/verify', { body: { email, code } }),
  adminMe: () => request('GET', '/admin/me', { auth: true }),
  adminListQuotes: () => request('GET', '/admin/quotes', { auth: true }),
  adminUpdateQuote: (qid, patch) => request('PATCH', `/admin/quotes/${qid}`, { body: patch, auth: true }),
  adminReplyQuote: (qid, payload) => request('POST', `/admin/quotes/${qid}/reply`, { body: payload, auth: true }),
  adminListCustomers: () => request('GET', '/admin/customers', { auth: true }),
  adminPutSettings: (data) => request('PUT', '/admin/settings', { body: { data }, auth: true }),
};

export default api;
