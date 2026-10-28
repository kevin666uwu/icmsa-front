import { useState } from 'react';
import { useRemote } from '../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../components/feedback/AsyncState.jsx';
import { read } from './api.js';
import { visibleNavigation } from './navigation.js';
import { navigate } from '../app/router/navigation.js';
import Dashboard from './Dashboard.jsx';
import ResourcePage from './ResourcePage.jsx';
import OrganizationPage from './organization/OrganizationPage.jsx';
import UsersPage from './admin/UsersPage.jsx';
import AdminInfo from './admin/AdminInfo.jsx';
import { SAN_ANGELO_LOGO } from './brand.js';
const load=signal=>read('/access',signal);
export default function Portal({ path, session }) {
  const remote=useRemote(load),[menu,setMenu]=useState(false);
  if(remote.loading)return <LoadingState label="Cargando acceso institucional…"/>;
  if(remote.error)return <ErrorState message={remote.error} onRetry={remote.refresh}/>;
  const access=remote.data,items=visibleNavigation(access),selected=items.find(i=>i.path===path||(path==='/admin'&&i.type==='users'));
  const groups=[...new Set(items.map(i=>i.group))];
  let content=<ErrorState message="Esta página no está disponible para tu cuenta."/>;
  if(selected?.resource)content=<ResourcePage key={selected.resource} name={selected.resource} spec={access.resources[selected.resource]} access={access}/>;
  else if(selected?.type==='dashboard')content=<Dashboard user={session.user}/>;
  else if(selected?.type==='organization')content=<OrganizationPage access={access}/>;
  else if(selected?.type==='users')content=<UsersPage user={session.user}/>;
  else if(selected?.type==='roles'||selected?.type==='settings')content=<AdminInfo key={selected.type} type={selected.type}/>;
  return <div className="workspace"><button className="mobile-menu" aria-expanded={menu} aria-controls="sidebar" onClick={()=>setMenu(v=>!v)}>☰ Menú</button>
    <aside id="sidebar" className={'sidebar '+(menu?'is-open':'')}><div className="sidebar-brand"><img src={SAN_ANGELO_LOGO} alt="" /><div><b>San Angelo</b><span>Instituto de Ciencias Médicas</span></div></div>
      <nav aria-label="Módulos institucionales">{groups.map(group=><section key={group}><h2>{group}</h2>{items.filter(i=>i.group===group).map(item=><a key={item.path} href={item.path} aria-current={selected===item?'page':undefined} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();navigate(item.path);setMenu(false);}}>{item.label}</a>)}</section>)}</nav><div className="sidebar-account"><strong>{session.user.name}</strong><span>{access.role}</span></div>
    </aside><div className="workspace-content">{content}</div></div>;
}
