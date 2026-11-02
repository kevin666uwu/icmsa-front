import { describe, it, expect } from 'vitest';
import { readPublicConfig, assertPublicEnvironment } from '../src/core/publicEnvironment.js';

describe('Public configuration contract', () => {
  it('preserves the canonical names, defaults and overrides', () => {
    expect(readPublicConfig({})).toEqual({apiBaseUrl:'http://localhost:8000',apiTimeoutMs:15000});
    expect(readPublicConfig({VITE_BACKEND_URL:'https://example.test/',VITE_API_TIMEOUT_MS:'60000'})).toEqual({apiBaseUrl:'https://example.test',apiTimeoutMs:60000});
    expect(readPublicConfig({VITE_API_TIMEOUT_MS:'NaN'},{apiTimeoutMs:45000}).apiTimeoutMs).toBe(45000);
  });
  it('rejects secret-bearing frontend names without echoing values', () => {
    for (const name of ['VITE_JWT_SECRET_KEY','VITE_DATABASE_URL','VITE_SMTP_PASSWORD','VITE_ACCESS_TOKEN','VITE_GOOGLE_SERVICE_ACCOUNT_JSON']) {
      expect(()=>assertPublicEnvironment({[name]:'sensitive-value'})).toThrow(/Sensitive configuration/);
      try { assertPublicEnvironment({[name]:'sensitive-value'}); } catch(e) { expect(e.message).not.toContain('sensitive-value'); }
    }
    expect(()=>assertPublicEnvironment({VITE_MP_PUBLIC_KEY:'public-value'})).not.toThrow();
  });
  it('rejects credentials, paths and malformed origins without echoing them', () => {
    for (const value of ['https://user:secret@example.test','https://example.test/api','not-an-origin','javascript:alert(1)']) {
      expect(()=>readPublicConfig({VITE_BACKEND_URL:value})).toThrow(/VITE_BACKEND_URL/);
    }
  });
});
