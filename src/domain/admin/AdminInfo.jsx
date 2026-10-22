import { useCallback } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read } from '../api.js';
export default function AdminInfo({ type }) {
  const loader=useCallback(signal=>read(type==='roles'?'/roles':'/config',signal),[type]);
  const remote=useRemote(loader);
  return <section><h1>{type==='roles'?'Roles y permisos':'Configuración institucional'}</h1><p>La API aplica permisos y alcances en cada operación. Los secretos se configuran exclusivamente en el entorno del servidor.</p>
    {remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:type==='roles'?<div className="two-columns">{Object.entries(remote.data).map(([role,permissions])=><article className="panel" key={role}><h2>{role}</h2><ul>{permissions.map(p=><li key={p}>{p}</li>)}</ul></article>)}</div>:<section className="panel"><h2>Estado del sistema</h2><p>Registro público: {remote.data.public_registration_enabled?'Habilitado':'Deshabilitado'}</p><p>Verificación de correo: {remote.data.email_verification_enabled?'Habilitada':'Deshabilitada'}</p><p>Modelo tecnológico: WEB MODEL 1.1.0</p><p>Identidad visual provisional. No hay reglas de calificaciones, créditos o pagos configuradas.</p></section>}
  </section>;
}
