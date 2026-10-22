import { useEffect, useSyncExternalStore } from 'react';
import { project } from './core/project.js';
import { useSession } from './hooks/useSession.js';
import { useAction } from './hooks/useRemote.js';
import { Button, Card, ResponsiveContainer } from './components/ui/Primitives.jsx';
import { EmptyState, ErrorState, LoadingState } from './components/feedback/AsyncState.jsx';
import { canAccessRoute, navigate } from './app/router/navigation.js';
import LoginPage from './features/account/LoginPage.jsx';
import EmailVerificationForm from './features/account/EmailVerificationForm.jsx';
import Users from './features/admin/Users.jsx';
const subscribe = callback => { window.addEventListener('popstate', callback); return () => window.removeEventListener('popstate', callback); };
const snapshot = () => window.location.pathname;
function Link({ to, children, ...props }) {
  return <a href={to} {...props} onClick={event => { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(to); }}>{children}</a>;
}
function Home() {
  return <><section className="hero"><p className="eyebrow">{project.eyebrow}</p><h1>{project.headline}</h1><p className="lede">{project.description}</p><div className="actions"><Link className="button primary" to={project.pages.length ? '/servicios' : '/portal'}>{project.pages.length ? 'Explorar servicios' : 'Abrir portal'}</Link><Link className="button secondary" to={project.pages.length ? '/contacto' : '/login'}>{project.pages.length ? 'Contacto' : 'Iniciar sesión'}</Link></div></section><div className="grid">{(project.services.length ? project.services : [{ title: 'Tu espacio', description: 'Consulta la información disponible para tu cuenta.' }, { title: 'Acceso seguro', description: 'Inicia sesión para acceder a las áreas privadas.' }, { title: 'Una interfaz sencilla', description: 'Utiliza el portal desde tu computadora o dispositivo móvil.' }]).map(item => <Card key={item.title}><h2>{item.title}</h2><p>{item.description}</p></Card>)}</div></>;
}
export default function App() {
  const path = useSyncExternalStore(subscribe, snapshot);
  const session = useSession(); const signOutAction = useAction();
  useEffect(() => { document.title = project.name; document.documentElement.style.setProperty('--accent', project.accent); }, []);
  useEffect(() => { document.getElementById('main-content')?.focus(); }, [path]);
  let content;
  if (session.loading) content = <LoadingState label="Comprobando sesión…" />;
  else if (!canAccessRoute(path, session.user)) content = session.user ? <ErrorState message="No tienes permisos para acceder a esta sección." /> : <EmptyState title="Inicia sesión para continuar" action={<Link className="button primary" to="/login">Iniciar sesión</Link>} />;
  else if (path === '/') content = <Home />;
  else if (path === '/login') content = <LoginPage session={session} />;
  else if (path === '/verify-email') content = <EmailVerificationForm key={session.user.id} session={session} />;
  else if (path === '/portal') content = <><h1>Tu portal</h1><Card><h2>Hola, {session.user.name}</h2><p>Tu cuenta está activa.</p>{session.user.email_verification_enabled && !session.user.email_verified && <p><Link to="/verify-email">Verifica tu correo</Link></p>}<EmptyState title="Sin actividad disponible" description="Aquí aparecerá la información de tu cuenta cuando esté disponible." /></Card></>;
  else if (path === '/admin') content = <Users currentUser={session.user} />;
  else {
    const page = project.pages.find(item => item.path === path);
    content = page ? <><h1>{page.title}</h1><p className="lede">{page.description}</p>{page.path === '/servicios' ? <div className="grid">{project.services.map(service => <Card key={service.title}><h2>{service.title}</h2><p>{service.description}</p></Card>)}</div> : <EmptyState title={page.emptyTitle || 'Información pendiente'} description={page.emptyDescription || 'Publicaremos la información cuando esté disponible.'} />}</> : <EmptyState title="Página no encontrada" action={<Link to="/">Volver al inicio</Link>} />;
  }
  return <><a className="skip-link" href="#main-content">Saltar al contenido</a><header><ResponsiveContainer><div className="header-row"><Link className="brand" to="/">{project.name}</Link><nav aria-label="Navegación principal"><Link to="/">Inicio</Link>{project.pages.map(page => <Link key={page.path} to={page.path}>{page.title}</Link>)}<Link to="/portal">Portal</Link>{session.user?.role === 'admin' && <Link to="/admin">Administración</Link>}{session.user ? <Button variant="secondary" disabled={signOutAction.busy} onClick={() => signOutAction.run(async () => { try { await session.signOut(); } finally { navigate('/'); } })}>Salir</Button> : <Link to="/login">Iniciar sesión</Link>}</nav></div></ResponsiveContainer></header><ResponsiveContainer><main id="main-content" tabIndex={-1}>{signOutAction.error && <ErrorState message={signOutAction.error} />}{content}</main><footer>{project.name}<span>Un espacio para conectar y trabajar.</span></footer></ResponsiveContainer></>;
}
