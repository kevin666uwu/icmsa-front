import { apiFetch } from './api.js';
import { clearSession, saveSession } from '../lib/session.js';
export async function login(email, password) {
  const data = await apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  saveSession(data.access_token);
  return data.user;
}
export async function register(name, email, password) {
  const data = await apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  saveSession(data.access_token);
  return data.user;
}
export const verifySession = signal => apiFetch('/api/v1/auth/me', { signal });
export async function logout() {
  try { await apiFetch('/api/v1/auth/logout', { method: 'POST' }); }
  finally { clearSession(); }
}
