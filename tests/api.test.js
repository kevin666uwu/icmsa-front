import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../src/services/api.js';
import { getToken, saveSession } from '../src/lib/session.js';
import { login, register } from '../src/services/auth.service.js';
afterEach(() => vi.unstubAllGlobals());
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
describe('API and session isolation', () => {
  it('attaches a token only to relative versioned API endpoints', async () => {
    saveSession('session-token');
    const fetch = vi.fn().mockResolvedValue(response({ ok: true })); vi.stubGlobal('fetch', fetch);
    await apiFetch('/api/v1/auth/me');
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer session-token');
    await expect(apiFetch('https://other.example/api/v1')).rejects.toMatchObject({ code: 'INVALID_ENDPOINT' });
    await expect(apiFetch('//other.example/api/v1')).rejects.toMatchObject({ code: 'INVALID_ENDPOINT' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('clears expired sessions and emits a neutral event', async () => {
    saveSession('expired'); const listener = vi.fn();
    window.addEventListener('web-model:session-expired', listener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ error: { message: 'Expired', code: 'UNAUTHORIZED' } }, 401)));
    await expect(apiFetch('/api/v1/auth/me')).rejects.toMatchObject({ status: 401, message: 'Expired' });
    expect(getToken()).toBeNull(); expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('web-model:session-expired', listener);
  });
  it('does not clear a new session when an older request fails', async () => {
    saveSession('old'); let resolve;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(done => { resolve = done; })));
    const request = apiFetch('/api/v1/auth/me');
    saveSession('new'); resolve(response({}, 401));
    await expect(request).rejects.toMatchObject({ status: 401 }); expect(getToken()).toBe('new');
  });
  it('distinguishes timeout, cancellation and connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    })));
    await expect(apiFetch('/api/v1/config', { timeoutMs: 5 })).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    const controller = new AbortController(); const pending = apiFetch('/api/v1/config', { signal: controller.signal }); controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failed')));
    await expect(apiFetch('/api/v1/config')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
  it('login and register use neutral contracts without role input', async () => {
    const user = { id: 1, name: 'Member', role: 'member', active: true };
    const fetch = vi.fn().mockImplementation(async () => response({ access_token: 'valid', user })); vi.stubGlobal('fetch', fetch);
    expect(await login('member@example.com', 'password')).toEqual(user);
    expect(await register('Member', 'member@example.com', 'password')).toEqual(user);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ name: 'Member', email: 'member@example.com', password: 'password' });
    expect(getToken()).toBe('valid');
  });
});
