import { useEffect, useSyncExternalStore } from 'react';
import { project } from './core/project.js';
import { useSession } from './hooks/useSession.js';
import { useAction } from './hooks/useRemote.js';
import { LoadingState, ErrorState } from './components/feedback/AsyncState.jsx';
import { canAccessRoute, navigate } from './app/router/navigation.js';
import LoginPage from './features/account/LoginPage.jsx';
import EmailVerificationForm from './features/account/EmailVerificationForm.jsx';
import Portal from './domain/Portal.jsx';
import PublicSite from './domain/PublicSite.jsx';
import './domain/institutional.css';
const subscribe=callback=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback);};
const snapshot=()=>window.location.pathname;
export default function App() {
  const path=useSyncExternalStore(subscribe,snapshot),session=useSession(),action=useAction();
  useEffect(()=>{document.title=project.name;},[]);
  useEffect(()=>{document.getElementById('main-content')?.focus();},[path]);
  let content;
  if(path==='/'||path==='/inicio')content=<PublicSite/>;
  else if(session.loading)content=<LoadingState label="Comprobando sesión…"/>;
  else if(!canAccessRoute(path,session.user))content=session.user?<ErrorState message="No tienes permisos para acceder a esta sección."/>:<LoginPage session={session}/>;
  else if(path==='/login'||!session.user)content=<div className="login-shell"><section className="login-brand-panel"><div className="login-brand-lockup"><img src="/san-angelo-logo.svg" alt="" /><div><span>Instituto de Ciencias Médicas</span><strong>San Angelo</strong></div></div><div className="login-copy"><p className="login-kicker">Plataforma institucional</p><h1>La operación institucional, en un solo lugar.</h1><p>Acceso privado para personal autorizado. Gestión académica, procesos, indicadores y operación interna.</p></div><small>Instituto de Ciencias Médicas San Angelo</small></section><section className="login-form-panel"><LoginPage session={session}/></section></div>;
  else if(path==='/verify-email')content=<EmailVerificationForm session={session}/>;
  else content=<Portal key={session.user.id} path={path} session={session}/>;
  return <><a className="skip-link" href="#main-content">Saltar al contenido</a>{path!=='/'&&path!=='/inicio'&&<header className="institutional-header"><a href="/" className="brand institutional-lockup" onClick={e=>{e.preventDefault();navigate('/');}}><img src="/san-angelo-logo.svg" alt="" /><span><b>San Angelo</b><small>Instituto de Ciencias Médicas</small></span></a>{session.user&&<button disabled={action.busy} onClick={()=>action.run(async()=>{try{await session.signOut();}finally{navigate('/login');}})}>Cerrar sesión</button>}</header>}
    {action.error&&<ErrorState message={action.error}/>}<main id="main-content" tabIndex={-1}>{content}</main></>;
}
