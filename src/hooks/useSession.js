import { useCallback, useEffect, useState } from 'react';
import { getToken, clearSession } from '../lib/session.js';
import { login, register, logout, verifySession } from '../services/auth.service.js';
export function useSession() {
  const [state, setState] = useState({ user: null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    const expired = () => setState({ user: null, loading: false });
    window.addEventListener('web-model:session-expired', expired);
    Promise.resolve().then(async () => {
      try {
        const user = getToken() ? await verifySession(controller.signal) : null;
        if (!controller.signal.aborted) setState({ user, loading: false });
      } catch {
        if (!controller.signal.aborted) { clearSession(); expired(); }
      }
    });
    return () => { controller.abort(); window.removeEventListener('web-model:session-expired', expired); };
  }, []);
  const signIn = useCallback(async (email, password) => {
    const user = await login(email, password); setState({ user, loading: false }); return user;
  }, []);
  const signUp = useCallback(async (name, email, password) => {
    const user = await register(name, email, password); setState({ user, loading: false }); return user;
  }, []);
  const signOut = useCallback(async () => {
    try { await logout(); } finally { setState({ user: null, loading: false }); }
  }, []);
  const refresh = useCallback(async () => {
    const user = await verifySession(); setState({ user, loading: false }); return user;
  }, []);
  return { ...state, signIn, signUp, signOut, refresh };
}
