import { useEffect, useSyncExternalStore } from 'react';
import { project } from './core/project.js';
import { useSession } from './hooks/useSession.js';
import { useAction } from './hooks/useRemote.js';
import { LoadingState, ErrorState } from './components/feedback/AsyncState.jsx';
import { canAccessRoute, navigate } from './app/router/navigation.js';
import LoginPage from './features/account/LoginPage.jsx';
import EmailVerificationForm from './features/account/EmailVerificationForm.jsx';
import Portal from './domain/Portal.jsx';
import './domain/institutional.css';
const subscribe=callback=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback);};
const snapshot=()=>window.location.pathname;
export default function App() {
  const path=useSyncExternalStore(subscribe,snapshot),session=useSession(),action=useAction();
  useEffect(()=>{document.title=project.name;},[]);
  useEffect(()=>{document.getElementById('main-content')?.focus();},[path]);
  let content;
  if(session.loading)content=<LoadingState label="Comprobando sesión…"/>;
  else if(!canAccessRoute(path,session.user))content=session.user?<ErrorState message="No tienes permisos para acceder a esta sección."/>:<LoginPage session={session}/>;
  else if(path==='/login'||!session.user)content=<div className="login-layout"><section className="login-intro"><p className="eyebrow">Instituto de Ciencias Médicas San Angelo</p><h1>Una institución conectada.</h1><p>Personas, procesos y comunidad académica en un mismo espacio.</p><span className="brand-badge">ICMSA OS</span></section><LoginPage session={session}/></div>;
  else if(path==='/verify-email')content=<EmailVerificationForm session={session}/>;
  else content=<Portal key={session.user.id} path={path==='/'?'/portal':path} session={session}/>;
  return <><a className="skip-link" href="#main-content">Saltar al contenido</a><header className="institutional-header"><a href="/" className="brand" onClick={e=>{e.preventDefault();navigate('/');}}>ICMSA OS</a><span>Instituto de Ciencias Médicas San Angelo</span>{session.user&&<button disabled={action.busy} onClick={()=>action.run(async()=>{try{await session.signOut();}finally{navigate('/login');}})}>Cerrar sesión</button>}</header>
    {action.error&&<ErrorState message={action.error}/>}<main id="main-content" tabIndex={-1}>{content}</main></>;
}
