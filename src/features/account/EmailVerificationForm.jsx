import { useEffect, useRef, useState } from 'react';
import { Button, Card, Input } from '../../components/ui/Primitives.jsx';
import { ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { verificationStatus, requestVerification, verifyEmailCode } from '../../services/emailVerification.service.js';
import { navigate } from '../../app/router/navigation.js';

const load = async signal => ({ ...await verificationStatus(signal), receivedAt: Date.now() });

export default function EmailVerificationForm({ session }) {
  const remote = useRemote(load);
  const action = useAction();
  const [result, setResult] = useState(null);
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now);
  const controller = useRef(null);
  useEffect(() => {
    controller.current = new AbortController();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(interval); controller.current.abort(); };
  }, []);
  const state = result || remote.data;
  const remaining = state ? Math.max(0, Math.ceil((state.receivedAt + state.retry_after_seconds * 1000 - Math.max(now, state.receivedAt)) / 1000)) : 0;
  const perform = task => action.run(async () => {
    const signal = controller.current.signal;
    try { await task(signal); }
    catch (error) {
      if (!signal.aborted && error.retryAfterSeconds) {
        setResult({ ...state, retry_after_seconds: error.retryAfterSeconds, receivedAt: Date.now() });
      }
      throw error;
    }
  });
  if (remote.loading) return <LoadingState label="Comprobando verificación…" />;
  if (remote.error) return <ErrorState message={remote.error} onRetry={remote.refresh} />;
  const verified = state?.email_verified || session.user?.email_verified;
  return <div className="narrow"><Card><h1>Verifica tu correo</h1>
    {verified ? <><p role="status">Correo verificado.</p><Button onClick={() => navigate(session.user?.role === 'admin' ? '/admin' : '/portal')}>Continuar</Button></> : <>
      <p>{state?.delivery_status === 'sent' ? 'Enviamos un código de 6 dígitos a tu correo.' :
        state?.delivery_status === 'not_requested' ? 'Solicita un código para verificar tu correo.' :
        'No podemos confirmar el envío. Revisa tu correo o solicita otro código cuando termine la espera.'}</p>
      <form aria-busy={action.busy} onSubmit={event => {
        event.preventDefault();
        perform(async signal => {
          await verifyEmailCode(code, signal);
          if (signal.aborted) return;
          await session.refresh();
          if (!signal.aborted) { setCode(''); setResult({ email_verified: true, retry_after_seconds: 0, receivedAt: Date.now() }); }
        });
      }}>
        <Input label="Código de verificación" name="code" value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={action.busy} />
        {action.error && <ErrorState message={action.error} />}
        <Button type="submit" disabled={action.busy || code.length !== 6}>{action.busy ? 'Procesando…' : 'Verificar correo'}</Button>
        <Button variant="secondary" disabled={action.busy || remaining > 0} onClick={() => perform(async signal => {
          const response = await requestVerification(signal);
          if (!signal.aborted) { setCode(''); setResult({ ...response, receivedAt: Date.now() }); }
        })}>{remaining > 0 ? `Reenviar código en ${remaining} s` : state?.delivery_status === 'not_requested' ? 'Solicitar código' : 'Reenviar código'}</Button>
      </form>
      <p role="status" aria-live="polite">{action.busy ? 'Procesando solicitud…' : ''}</p>
    </>}
  </Card></div>;
}
