import Documents from './documents/Documents.jsx';
import { useEffect, useState } from 'react';
import { useRemote } from '../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../components/feedback/AsyncState.jsx';
import { read } from './api.js';
import { visibleNavigation, studentNavigation, hiddenRoute } from './navigation.js';
import { navigate } from '../app/router/navigation.js';
import Dashboard from './Dashboard.jsx';
import ResourcePage from './ResourcePage.jsx';
import OrganizationPage from './organization/OrganizationPage.jsx';
import UsersPage from './admin/UsersPage.jsx';
import AdminInfo from './admin/AdminInfo.jsx';
import AdmissionsPage from './admissions/AdmissionsPage.jsx';
import StudentPortal from './student/StudentPortal.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SAN_ANGELO_LOGO } from './brand.js';
const load=signal=>read('/access',signal);
const oldOrganizationRoutes=new Set([
  '/portal/personal',
  '/portal/organizacion/departamentos',
  '/portal/organizacion/areas',
  '/portal/organizacion/puestos',
]);
const legacyServiceResources={
  '/portal/servicios-escolares':'school_service_requests',
  '/portal/servicios-estudiantiles':'student_service_cases',
};
export default function Portal({ path, session }) {
  const remote=useRemote(load),[menu,setMenu]=useState(false);
  useEffect(()=>{
    window.scrollTo({top:0,left:0,behavior:'auto'});
    document.querySelector('.workspace-content')?.scrollTo({top:0,left:0,behavior:'auto'});
  },[path]);
  useEffect(()=>{
    // Al iniciar sesión administrativa, abrir directamente Organigrama.
    // El portal estudiantil conserva su propia página de inicio.
    if(path==='/portal' && remote.data?.role!=='student' && remote.data?.permissions?.includes('organization.read')){
      navigate('/portal/organigrama',{replace:true});
    }
  },[path,remote.data]);
  if(remote.loading)return <LoadingState label="Cargando acceso institucional…"/>;
  if(remote.error)return <ErrorState message={remote.error} onRetry={remote.refresh}/>;
  const access=remote.data;
  if(access.role==='student'){
    const selectedStudent=studentNavigation.find(item=>item.path===path)||studentNavigation[0];
    return <StudentPortal view={selectedStudent.view} user={session.user} path={path} session={session}/>;
  }
  const items=visibleNavigation(access);
  const effectivePath=(path==='/portal' && access.permissions?.includes('organization.read'))||oldOrganizationRoutes.has(path)?'/portal/organigrama':path;
  const legacyResource=legacyServiceResources[path];
  // Menú minimalista; enlaces antiguos conservan acceso sujeto a permisos.
  const selected=items.find(i=>i.path===effectivePath)
    || hiddenRoute(path==='/admin'?'/admin/usuarios':path,access)
    || (legacyResource && access.resources[legacyResource] ? {resource:legacyResource}:undefined);
  const groups=[...new Set(items.map(i=>i.group))];
  const links=groups.map(group=><section key={group}>{items.length>1&&<h2>{group}</h2>}{items.filter(i=>i.group===group).map(item=><a key={item.path} href={item.path} aria-current={selected===item?'page':undefined} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();navigate(item.path);setMenu(false);}}>{item.label}</a>)}</section>);
  let content=<ErrorState message="Esta página no está disponible para tu cuenta."/>;
  if(selected?.resource)content=<ResourcePage key={selected.resource} name={selected.resource} spec={access.resources[selected.resource]} access={access}/>;
  else if(selected?.type==='dashboard')content=<Dashboard user={session.user}/>;
  else if(selected?.type==='organization')content=<OrganizationPage access={access}/>;
  else if(selected?.type==='student')content=<StudentPortal view={selected.view} user={session.user}/>;
  else if(selected?.type==='documents')content=<Documents admin/>;
  else if(selected?.type==='admissions')content=<AdmissionsPage/>;
  else if(selected?.type==='users')content=<UsersPage user={session.user}/>;
  else if(selected?.type==='roles'||selected?.type==='settings')content=<AdminInfo key={selected.type} type={selected.type}/>;
  return <div className="workspace"><button className="mobile-menu" aria-expanded={menu} aria-controls="mobile-admin-navigation" aria-haspopup="dialog" onClick={()=>setMenu(v=>!v)}>☰ Menú</button>
    <aside id="sidebar" className="sidebar"><div className="sidebar-brand"><img src={SAN_ANGELO_LOGO} alt="" /><div><b>San Ángelo</b><span>Instituto de Ciencias Médicas</span></div></div>
      <nav aria-label="Módulos institucionales">{links}</nav><div className="sidebar-account"><strong>{session.user.name}</strong><span>{access.role}</span></div>
    </aside><div className="workspace-content">{content}</div>{menu&&<Modal title="Menú institucional" className="mobile-navigation" onClose={()=>setMenu(false)}><nav id="mobile-admin-navigation" className="mobile-admin-links" aria-label="Módulos institucionales">{links}</nav><p className="mobile-admin-account">{session.user.name} · {access.role}</p></Modal>}</div>;
}

