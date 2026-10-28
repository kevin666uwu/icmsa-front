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
import { SAN_ANGELO_LOGO } from './domain/brand.js';
import './domain/institutional.css';
const subscribe=callback=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback);};
const snapshot=()=>window.location.pathname;
export default function App() {
  const path=useSyncExternalStore(subscribe,snapshot),session=useSession(),action=useAction();
  useEffect(()=>{
    document.title=project.name;
    let icon=document.querySelector('link[rel="icon"]');
    if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon);}
    icon.type='image/png';icon.href=SAN_ANGELO_LOGO;
    let shortcut=document.querySelector('link[rel="shortcut icon"]');
    if(!shortcut){shortcut=document.createElement('link');shortcut.rel='shortcut icon';document.head.appendChild(shortcut);}
    shortcut.href=SAN_ANGELO_LOGO;
  },[]);
  useEffect(()=>{
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.workspace-content')?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  },[path]);
  let content;
  if(path==='/'||path==='/inicio')content=<PublicSite/>;
  else if(session.loading)content=<LoadingState label="Comprobando sesión…"/>;
  else if(!canAccessRoute(path,session.user))content=session.user?<ErrorState message="No tienes permisos para acceder a esta sección."/>:<LoginPage session={session}/>;
  else if(path==='/login'||!session.user)content=<div className="login-shell"><section className="login-brand-panel"><div className="login-brand-lockup"><img src={SAN_ANGELO_LOGO} alt="" /><div><span>Instituto de Ciencias Médicas</span><strong>San Angelo</strong></div></div><div className="login-copy"><p className="login-kicker">Plataforma institucional</p><h1>La operación institucional, en un solo lugar.</h1><p>Acceso privado para personal autorizado. Gestión académica, procesos, indicadores y operación interna.</p></div><small>Instituto de Ciencias Médicas San Angelo</small></section><section className="login-form-panel"><LoginPage session={session}/></section></div>;
  else if(path==='/verify-email')content=<EmailVerificationForm session={session}/>;
  else content=<Portal key={session.user.id} path={path} session={session}/>;
  return <><a className="skip-link" href="#main-content">Saltar al contenido</a>{path!=='/'&&path!=='/inicio'&&session.user?.role!=='student'&&<header className="institutional-header"><a href="/" className="brand institutional-lockup" onClick={e=>{e.preventDefault();navigate('/');}}><img src={SAN_ANGELO_LOGO} alt="" /><span><b>San Angelo</b><small>Instituto de Ciencias Médicas</small></span></a>{session.user&&<button disabled={action.busy} onClick={()=>action.run(async()=>{try{await session.signOut();}finally{navigate('/login');}})}>Cerrar sesión</button>}</header>}
    {action.error&&<ErrorState message={action.error}/>}<main id="main-content" tabIndex={-1}>{content}</main></>;
}
