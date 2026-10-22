import { useCallback, useEffect, useRef, useState } from 'react';
import { userFacingError } from '../lib/errors.js';
export function useRemote(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      setState({ data: null, loading: true, error: '' });
      return loader(controller.signal);
    }).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ data: null, loading: false, error: userFacingError(error) });
    });
    return () => controller.abort();
  }, [loader, version]);
  return { ...state, refresh };
}
export function useAction() {
  const guard = useRef(false);
  const [state, setState] = useState({ busy: false, error: '' });
  const run = useCallback(async action => {
    if (guard.current) return;
    guard.current = true;
    setState({ busy: true, error: '' });
    try { const result = await action(); setState({ busy: false, error: '' }); return result; }
    catch (error) { setState({ busy: false, error: userFacingError(error) }); }
    finally { guard.current = false; }
  }, []);
  return { ...state, run };
}
