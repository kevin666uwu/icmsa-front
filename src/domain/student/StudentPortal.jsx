import { useState } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read } from '../api.js';
import { navigate } from '../../app/router/navigation.js';
import { SAN_ANGELO_LOGO } from '../brand.js';

const load=signal=>read('/student-portal',signal);
const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(value||0));
const pct=value=>Math.max(0,Math.min(100,Number(value||0)));
const studentNav=[
  ['/portal','Inicio','⌂'],
  ['/portal/mis-clases','Aula virtual','▣'],
  ['/portal/avance','Mi avance','◔'],
  ['/portal/carrera','Mi carrera','◇'],
  ['/portal/profesores','Profesores','◎'],
  ['/portal/pagos','Pagos','◫'],
  ['/portal/tramites','Trámites','↗'],
  ['/portal/documentos','Documentos','▤'],
];
function Empty({title,children}){return <div className="campus-empty"><strong>{title}</strong><p>{children}</p></div>;}
function ProgressBar({value}){return <div className="campus-progress"><span style={{width:pct(value)+'%'}}/></div>;}
function ClassCard({row}){return <article className="campus-class-card">
  <div className="campus-class-icon">{(row.subject_code||row.subject_name||'M').slice(0,2).toUpperCase()}</div>
  <div className="campus-class-copy"><small>{row.subject_code||'Materia'}</small><h3>{row.subject_name||row.group_name}</h3><p>{row.period_name||'Periodo vigente'} · {row.teacher_name}</p><ProgressBar value={row.progress}/></div>
  <div className="campus-class-side"><strong>{pct(row.progress)}%</strong><span>{row.grade!==null&&row.grade!==undefined?'Cal. '+Number(row.grade).toFixed(1):'En curso'}</span></div>
</article>;}
function Overview({data,user}){const s=data.student,p=data.program,m=data.summary,active=data.classes.filter(x=>x.status==='active');return <>
  <section className="campus-welcome">
    <div><p className="campus-kicker">Tu campus digital</p><h1>Hola, {user.name?.split(' ')[0]}.</h1><p>{p?.name||'Tu programa académico'} · Todo lo importante de tu vida académica, en un solo lugar.</p></div>
    <div className="campus-student-chip"><span>Matrícula</span><strong>{s.student_number}</strong><small>{s.status}</small></div>
  </section>
  <section className="campus-priority-grid">
    <article className="campus-priority campus-priority-gold"><span>Avance curricular</span><strong>{m.career_progress}%</strong><ProgressBar value={m.career_progress}/><button onClick={()=>navigate('/portal/avance')}>Ver mi avance</button></article>
    <article className="campus-priority"><span>Clases activas</span><strong>{m.active_classes}</strong><p>{active[0]?.subject_name?'Continúa con '+active[0].subject_name:'No hay clases activas registradas.'}</p><button onClick={()=>navigate('/portal/mis-clases')}>Entrar al aula</button></article>
    <article className="campus-priority"><span>Saldo pendiente</span><strong className={m.balance>0?'balance-positive':'balance-zero'}>{money(m.balance)}</strong><p>{m.balance>0?'Revisa fechas y movimientos de tu cuenta.':'Tu cuenta está al corriente.'}</p><button onClick={()=>navigate('/portal/pagos')}>Ver finanzas</button></article>
    <article className="campus-priority"><span>Trámites abiertos</span><strong>{m.open_requests}</strong><p>Consulta el estado de tus solicitudes y servicios.</p><button onClick={()=>navigate('/portal/tramites')}>Mis trámites</button></article>
  </section>
  <section className="campus-home-grid">
    <div className="campus-card"><div className="campus-card-heading"><div><p className="campus-kicker">Aula virtual</p><h2>Continúa donde te quedaste</h2></div><button onClick={()=>navigate('/portal/mis-clases')}>Ver todas</button></div>
      {active.length?<div className="campus-class-list">{active.slice(0,3).map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty title="Sin clases activas">Cuando administración asigne tus materias, aparecerán aquí.</Empty>}
    </div>
    <div className="campus-card campus-program-card"><p className="campus-kicker">Mi carrera</p><h2>{p?.name||'Programa por asignar'}</h2><p>{p?.description||'Aquí verás la información de tu plan académico y progreso general.'}</p><div className="campus-ring" style={{'--progress':pct(m.career_progress)+'%'}}><span>{m.career_progress}%</span></div><button onClick={()=>navigate('/portal/carrera')}>Ver información de carrera</button></div>
  </section>
  <section className="campus-card"><div className="campus-card-heading"><div><p className="campus-kicker">Accesos rápidos</p><h2>¿Qué necesitas hacer?</h2></div></div><div className="campus-shortcuts">
    {[['Mis profesores','/portal/profesores','Conoce a tus docentes'],['Pagos y saldo','/portal/pagos','Consulta cargos y abonos'],['Trámites','/portal/tramites','Da seguimiento a solicitudes'],['Documentos','/portal/documentos','Consulta archivos académicos']].map(([t,p,d])=><button key={p} onClick={()=>navigate(p)}><strong>{t}</strong><span>{d}</span><b>→</b></button>)}
  </div></section>
</>;}
function Classes({data}){return <Page title="Aula virtual" kicker="Mis clases" intro="Tus materias activas, profesores y avance por curso.">{data.classes.length?<div className="campus-class-list">{data.classes.map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty title="Aún no tienes materias inscritas">Tus clases aparecerán aquí cuando se asignen a tu expediente.</Empty>}</Page>;}
function Progress({data}){return <Page title="Mi avance curricular" kicker="Trayectoria académica" intro="Visualiza cómo avanzas materia por materia dentro de tu programa."><div className="campus-progress-summary"><div><strong>{data.summary.career_progress}%</strong><span>avance general</span></div><ProgressBar value={data.summary.career_progress}/><p>{data.summary.completed_classes} materias completadas · {data.summary.active_classes} en curso</p></div>{data.classes.length?<div className="campus-class-list">{data.classes.map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty title="Sin historial académico">Tu avance se construirá conforme curses materias.</Empty>}</Page>;}
function Finance({data}){const f=data.finance;return <Page title="Pagos y saldos" kicker="Mis finanzas" intro="Consulta cargos, pagos y fechas límite sin mezclarlo con tu experiencia académica."><div className="campus-finance-grid"><article><span>Saldo pendiente</span><strong>{money(f.balance)}</strong></article><article><span>Total pagado</span><strong>{money(f.total_paid)}</strong></article><article><span>Total cargado</span><strong>{money(f.total_charged)}</strong></article></div>{f.entries.length?<div className="campus-movements">{f.entries.map(row=><article key={row.id}><div><strong>{row.concept}</strong><span>{row.due_date?'Vence '+row.due_date:'Sin fecha límite'}</span></div><div><strong>{money(Number(row.amount)-Number(row.paid_amount))}</strong><span>{row.status}</span></div></article>)}</div>:<Empty title="Sin movimientos">No hay cargos ni pagos registrados todavía.</Empty>}</Page>;}
function Program({data}){const p=data.program,s=data.student;return <Page title="Mi carrera" kicker="Información académica" intro="Conoce los datos de tu programa y tu expediente."><div className="campus-program-detail"><div><span>Programa</span><strong>{p?.name||'Por asignar'}</strong><p>{p?.description||'Sin descripción registrada.'}</p></div><dl><div><dt>Matrícula</dt><dd>{s.student_number}</dd></div><div><dt>Estado</dt><dd>{s.status}</dd></div><div><dt>Clave</dt><dd>{p?.code||'—'}</dd></div><div><dt>Correo</dt><dd>{s.email||'—'}</dd></div></dl></div></Page>;}
function Teachers({data}){return <Page title="Mis profesores" kicker="Equipo académico" intro="Los docentes responsables de tus materias actuales.">{data.teachers.length?<div className="campus-teacher-grid">{data.teachers.map(t=><article key={t.id}><div className="campus-avatar">{t.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><strong>{t.name}</strong><span>{t.email||'Correo institucional no registrado'}</span></article>)}</div>:<Empty title="Profesores por asignar">Tus profesores aparecerán cuando administración asigne docentes a tus grupos.</Empty>}</Page>;}
function Services({data}){const s=data.services||{school_requests:[],student_cases:[]};const rows=[...s.school_requests.map(x=>({...x,label:x.request_type,type:'Servicio escolar'})),...s.student_cases.map(x=>({...x,label:x.category,type:'Servicio estudiantil'}))];return <Page title="Mis trámites" kicker="Servicios" intro="Da seguimiento a solicitudes escolares y casos de atención estudiantil.">{rows.length?<div className="campus-service-list">{rows.map((row,i)=><article key={row.id+'-'+i}><div><small>{row.type}</small><strong>{row.label}</strong><p>{row.notes||row.description||'Sin notas adicionales.'}</p></div><span className={'campus-status '+row.status}>{row.status}</span></article>)}</div>:<Empty title="No tienes trámites abiertos">Tus solicitudes aparecerán aquí cuando se registren.</Empty>}</Page>;}
function Documents(){return <Page title="Mis documentos" kicker="Expediente digital" intro="Un espacio para concentrar constancias, documentos académicos y archivos importantes."><Empty title="Tu expediente digital está listo para crecer">Aún no hay documentos vinculados a tu cuenta. Cuando se carguen, podrás consultarlos desde aquí.</Empty></Page>;}
function Page({title,kicker,intro,children}){return <section className="campus-page"><p className="campus-kicker">{kicker}</p><h1>{title}</h1><p className="campus-page-intro">{intro}</p>{children}</section>;}
export default function StudentPortal({view='overview',user,path,session}){
  const [menu,setMenu]=useState(false);
  const remote=useRemote(load);
  if(remote.loading)return <LoadingState label="Preparando tu campus…"/>;
  if(remote.error)return <ErrorState message={remote.error} onRetry={remote.refresh}/>;
  const data=remote.data;
  let content=<Overview data={data} user={user}/>;
  if(view==='classes')content=<Classes data={data}/>;
  if(view==='progress')content=<Progress data={data}/>;
  if(view==='finance')content=<Finance data={data}/>;
  if(view==='program')content=<Program data={data}/>;
  if(view==='teachers')content=<Teachers data={data}/>;
  if(view==='services')content=<Services data={data}/>;
  if(view==='documents')content=<Documents/>;
  return <div className="campus-shell">
    <header className="campus-header"><a href="/portal" onClick={e=>{e.preventDefault();navigate('/portal');}} className="campus-brand"><img src={SAN_ANGELO_LOGO} alt=""/><span><b>San Angelo</b><small>Portal del alumno</small></span></a><button className="campus-menu-button" onClick={()=>setMenu(v=>!v)}>Menú</button><nav className={menu?'is-open':''}>{studentNav.slice(0,5).map(([p,l])=><a key={p} href={p} aria-current={path===p?'page':undefined} onClick={e=>{e.preventDefault();navigate(p);setMenu(false);}}>{l}</a>)}</nav><div className="campus-user"><span>{user.name}</span><small>Alumno</small>{session&&<button onClick={async()=>{await session.signOut();navigate('/login');}}>Salir</button>}</div></header>
    <div className="campus-subnav">{studentNav.slice(5).map(([p,l,icon])=><a key={p} href={p} aria-current={path===p?'page':undefined} onClick={e=>{e.preventDefault();navigate(p);}}><span>{icon}</span>{l}</a>)}</div>
    <main className="campus-main">{content}</main>
  </div>;
}
