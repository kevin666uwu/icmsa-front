import { useState } from 'react';
import { Button, Card, Input } from '../../components/ui/Primitives.jsx';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { apiFetch } from '../../services/api.js';
import { navigate } from '../../app/router/navigation.js';
const loadConfig = signal => apiFetch('/api/v1/config', { signal });
export default function LoginPage({ session }) {
  const [register, setRegister] = useState(false); const action = useAction(); const config = useRemote(loadConfig);
  return <div className="narrow"><Card><h1>{register ? 'Crear cuenta' : 'Iniciar sesión'}</h1><p>Accede a tu espacio de trabajo.</p><form onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    action.run(async () => {
      if (register && data.get('password') !== data.get('confirmPassword')) throw new Error('Las contraseñas no coinciden.');
      const user = register ? await session.signUp(data.get('name'), data.get('email'), data.get('password')) : await session.signIn(data.get('email'), data.get('password'));
      navigate(user.email_verification_enabled && !user.email_verified ? '/verify-email' : '/portal');
    });
  }}>
    {register && <Input label="Nombre" name="name" required maxLength={120} autoComplete="name" />}
    <Input label="Correo" name="email" type="email" required autoComplete="username" />
    <Input label="Contraseña" name="password" type="password" required minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} />
    {register && <Input label="Confirmar contraseña" name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />}
    {action.error && <ErrorState message={action.error} />}
    <Button type="submit" disabled={action.busy}>{action.busy ? 'Procesando…' : register ? 'Crear cuenta' : 'Entrar'}</Button>
  </form>{config.data?.public_registration_enabled && <Button variant="secondary" disabled={action.busy} onClick={() => setRegister(value => !value)}>{register ? 'Ya tengo cuenta' : 'Crear cuenta'}</Button>}</Card></div>;
}
