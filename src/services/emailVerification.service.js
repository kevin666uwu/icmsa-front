import { apiFetch } from './api.js';
export const verificationStatus = signal => apiFetch('/api/v1/auth/email-verification', { signal });
export const requestVerification = signal => apiFetch('/api/v1/auth/email-verification/resend', { method: 'POST', signal });
export const verifyEmailCode = (code, signal) => apiFetch('/api/v1/auth/email-verification/verify', {
  method: 'POST', body: JSON.stringify({ code }), signal,
});
