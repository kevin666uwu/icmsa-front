const environment = import.meta.env || {};
const parsedTimeout = Number(environment.VITE_API_TIMEOUT_MS);
const apiBaseUrl = environment.VITE_BACKEND_URL || 'http://localhost:8000';
const url = new URL(apiBaseUrl);
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('VITE_BACKEND_URL must be an HTTP(S) origin without credentials or a path');
}
export const appConfig = Object.freeze({
  apiBaseUrl: url.origin,
  apiTimeoutMs: Number.isInteger(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 15000,
});
