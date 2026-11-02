// Never include environment values in errors: VITE_* values are public at build time.
export function assertPublicEnvironment(environment) {
  for (const name of Object.keys(environment)) {
    if (/^VITE_.*(?:SECRET|PASSWORD|PRIVATE_KEY|SERVICE_ACCOUNT|DATABASE_URL|ACCESS_TOKEN)/i.test(name)) {
      throw new Error('Sensitive configuration cannot use a VITE_ variable. Remove it and rotate any exposed credential.');
    }
  }
}
export function readPublicConfig(environment, defaults = {}) {
  assertPublicEnvironment(environment);
  let url;
  try { url = new URL(environment.VITE_BACKEND_URL || defaults.apiBaseUrl || 'http://localhost:8000'); }
  catch { throw new Error('VITE_BACKEND_URL must be a valid HTTP(S) origin'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_BACKEND_URL must be an HTTP(S) origin without credentials or a path');
  }
  const timeout = Number(environment.VITE_API_TIMEOUT_MS);
  return { apiBaseUrl: url.origin, apiTimeoutMs: Number.isInteger(timeout) && timeout > 0 ? timeout : defaults.apiTimeoutMs || 15000 };
}
