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
  getCategories: () => request('GET', '/categories'),
  submitQuote: (payload) => request('POST', '/quotes', { body: payload }),

  // Admin auth
  adminLogin: (email, password) => request('POST', '/admin/auth/login', { body: { email, password } }),
  adminVerify: (email, code) => request('POST', '/admin/auth/verify', { body: { email, code } }),
  adminMe: () => request('GET', '/admin/me', { auth: true }),
  adminChangePassword: (currentPassword, newPassword) => request('POST', '/admin/account/change-password', { body: { currentPassword, newPassword }, auth: true }),
  adminChangeEmail: (newEmail, currentPassword) => request('POST', '/admin/account/change-email', { body: { newEmail, currentPassword }, auth: true }),

  // Admin quotes
  adminListQuotes: () => request('GET', '/admin/quotes', { auth: true }),
  adminUpdateQuote: (qid, patch) => request('PATCH', `/admin/quotes/${qid}`, { body: patch, auth: true }),
  adminDeleteQuote: (qid) => request('DELETE', `/admin/quotes/${qid}`, { auth: true }),
  adminReplyQuote: (qid, payload) => request('POST', `/admin/quotes/${qid}/reply`, { body: payload, auth: true }),

  // Admin customers
  adminListCustomers: () => request('GET', '/admin/customers', { auth: true }),
  adminUpdateCustomer: (email, patch) => request('PUT', `/admin/customers/${encodeURIComponent(email)}`, { body: patch, auth: true }),
  adminDeleteCustomer: (email) => request('DELETE', `/admin/customers/${encodeURIComponent(email)}`, { auth: true }),
  adminEmailCustomer: (email, payload) => request('POST', `/admin/customers/${encodeURIComponent(email)}/email`, { body: payload, auth: true }),

  // Admin settings + email
  adminPutSettings: (data) => request('PUT', '/admin/settings', { body: { data }, auth: true }),
  adminEmailTest: (to) => request('POST', '/admin/email/test', { body: { to }, auth: true }),
  adminEmailBlast: (payload) => request('POST', '/admin/email/blast', { body: payload, auth: true }),
  adminEmailHistory: () => request('GET', '/admin/email/history', { auth: true }),

  // Admin products
  adminListProducts: () => request('GET', '/admin/products', { auth: true }),
  adminCreateProduct: (product) => request('POST', '/admin/products', { body: product, auth: true }),
  adminUpdateProduct: (pid, product) => request('PUT', `/admin/products/${pid}`, { body: product, auth: true }),
  adminDeleteProduct: (pid) => request('DELETE', `/admin/products/${pid}`, { auth: true }),
  adminRetranslateProduct: (pid) => request('POST', `/admin/products/${pid}/translate`, { body: {}, auth: true }),

  // Admin categories
  adminListCategories: () => request('GET', '/admin/categories', { auth: true }),
  adminCreateCategory: (cat) => request('POST', '/admin/categories', { body: cat, auth: true }),
  adminUpdateCategory: (cid, cat) => request('PUT', `/admin/categories/${cid}`, { body: cat, auth: true }),
  adminDeleteCategory: (cid) => request('DELETE', `/admin/categories/${cid}`, { auth: true }),

  // Admin team / RBAC
  adminListTeam: () => request('GET', '/admin/team', { auth: true }),
  adminCreateTeam: (member) => request('POST', '/admin/team', { body: member, auth: true }),
  adminUpdateTeam: (mid, patch) => request('PATCH', `/admin/team/${mid}`, { body: patch, auth: true }),
  adminDeleteTeam: (mid) => request('DELETE', `/admin/team/${mid}`, { auth: true }),

  // Email templates
  adminListTemplates: () => request('GET', '/admin/email/templates', { auth: true }),
  adminCreateTemplate: (tpl) => request('POST', '/admin/email/templates', { body: tpl, auth: true }),
  adminUpdateTemplate: (tid, tpl) => request('PUT', `/admin/email/templates/${tid}`, { body: tpl, auth: true }),
  adminDeleteTemplate: (tid) => request('DELETE', `/admin/email/templates/${tid}`, { auth: true }),

  // AI assistant — conversations + actions
  aiChat: (payload) => request('POST', '/admin/ai/chat', { body: payload, auth: true }),
  aiListConversations: () => request('GET', '/admin/ai/conversations', { auth: true }),
  aiCreateConversation: () => request('POST', '/admin/ai/conversations', { body: {}, auth: true }),
  aiGetConversation: (cid) => request('GET', `/admin/ai/conversations/${cid}`, { auth: true }),
  aiRenameConversation: (cid, title) => request('PATCH', `/admin/ai/conversations/${cid}`, { body: { title }, auth: true }),
  aiDeleteConversation: (cid) => request('DELETE', `/admin/ai/conversations/${cid}`, { auth: true }),
  aiSendMessage: (cid, payload) => request('POST', `/admin/ai/conversations/${cid}/messages`, { body: payload, auth: true }),
  aiEditMessage: (cid, mid, payload) => request('PATCH', `/admin/ai/conversations/${cid}/messages/${mid}`, { body: payload, auth: true }),
  aiUndoAction: (aid) => request('POST', `/admin/ai/actions/${aid}/undo`, { body: {}, auth: true }),
  aiListDocuments: () => request('GET', '/admin/ai/documents', { auth: true }),
  aiGetDocument: (did) => request('GET', `/admin/ai/documents/${did}`, { auth: true }),
  aiDeleteDocument: (did) => request('DELETE', `/admin/ai/documents/${did}`, { auth: true }),
};

export default api;
