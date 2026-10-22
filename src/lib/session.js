import { project } from '../core/project.js';
const TOKEN_KEY = `${project.id}:access-token`;
function storage() {
  try { return typeof window === 'undefined' ? null : window.sessionStorage; }
  catch { return null; }
}
export function getToken() { return storage()?.getItem(TOKEN_KEY) || null; }
export function saveSession(token) {
  if (typeof token !== 'string' || !token) throw new Error('Respuesta de sesión inválida.');
  const current = storage();
  if (!current) throw new Error('El almacenamiento de sesión no está disponible.');
  current.setItem(TOKEN_KEY, token);
}
export function clearSession() { storage()?.removeItem(TOKEN_KEY); }
