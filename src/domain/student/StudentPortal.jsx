import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read } from '../api.js';

const load=signal=>read('/student-portal',signal);
const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(value||0));
const pct=value=>Math.max(0,Math.min(100,Number(value||0)));

function Empty({children}){return <div className="student-empty">{children}</div>;}

function Overview({data,user}){
  const s=data.student, p=data.program, m=data.summary;
  return <div className="student-shell">
    <section className="student-hero">
      <div><p className="eyebrow">Portal del alumno</p><h1>Hola, {user.name}.</h1><p>{p?.name||'Tu programa académico'} · Consulta aquí tus clases, avance, profesores y situación financiera.</p></div>
      <div className="student-id"><span>Matrícula</span><strong>{s.student_number}</strong><span>Estado</span><strong>{s.status}</strong></div>
    </section>
    <div className="student-metrics">
      <article className="student-metric"><span>Avance de carrera</span><strong>{m.career_progress}%</strong></article>
      <article className="student-metric"><span>Clases activas</span><strong>{m.active_classes}</strong></article>
      <article className="student-metric"><span>Materias completadas</span><strong>{m.completed_classes}</strong></article>
      <article className="student-metric"><span>Saldo pendiente</span><strong className={m.balance>0?'balance-positive':'balance-zero'}>{money(m.balance)}</strong></article>
    </div>
    <div className="student-grid">
      <section className="student-panel"><div className="student-section-title"><div><h2>Mis clases</h2><p>Materias activas y progreso actual.</p></div></div>
        {data.classes.filter(x=>x.status==='active').length?<div className="class-list">{data.classes.filter(x=>x.status==='active').slice(0,4).map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty>No tienes clases activas registradas todavía.</Empty>}
      </section>
      <section className="student-panel"><h2>Mi carrera</h2>{p?<div className="student-program"><span className="program-name">{p.name}</span><p>{p.description||'Información académica del programa.'}</p><div className="progress-track"><span style={{width:pct(m.career_progress)+'%'}}/></div><small>{m.career_progress}% de avance registrado</small></div>:<Empty>Tu expediente todavía no tiene un programa académico asignado.</Empty>}</section>
    </div>
  </div>;
}

function ClassCard({row}){
  return <article className="class-card"><div><h3>{row.subject_name||row.group_name}</h3><p>{row.group_name}{row.period_name?' · '+row.period_name:''}</p><p>Profesor: {row.teacher_name}</p><div className="progress-track"><span style={{width:pct(row.progress)+'%'}}/></div></div><div><small>{pct(row.progress)}%</small>{row.grade!==null&&row.grade!==undefined&&<strong style={{display:'block',marginTop:6}}>Cal. {Number(row.grade).toFixed(1)}</strong>}</div></article>;
}

function Classes({data}){return <section className="student-panel"><div className="student-section-title"><div><p className="eyebrow">Mi aula</p><h2>Mis clases</h2><p>Materias, grupos, periodos y profesores asignados.</p></div></div>{data.classes.length?<div className="class-list">{data.classes.map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty>No hay materias inscritas todavía.</Empty>}</section>;}

function Progress({data}){return <section className="student-panel"><div className="student-section-title"><div><p className="eyebrow">Trayectoria académica</p><h2>Mi avance</h2><p>Progreso registrado por materia y avance general.</p></div><strong>{data.summary.career_progress}%</strong></div>{data.classes.length?<div className="class-list">{data.classes.map(row=><ClassCard key={row.id} row={row}/>)}</div>:<Empty>Tu avance aparecerá cuando tengas materias inscritas.</Empty>}</section>;}

function Finance({data}){const f=data.finance;return <div className="student-shell"><div className="student-metrics"><article className="student-metric"><span>Total cargado</span><strong>{money(f.total_charged)}</strong></article><article className="student-metric"><span>Total pagado</span><strong>{money(f.total_paid)}</strong></article><article className="student-metric"><span>Saldo pendiente</span><strong className={f.balance>0?'balance-positive':'balance-zero'}>{money(f.balance)}</strong></article><article className="student-metric"><span>Movimientos</span><strong>{f.entries.length}</strong></article></div><section className="student-panel"><p className="eyebrow">Finanzas</p><h2>Pagos y saldo</h2>{f.entries.length?<div className="table-scroll"><table className="student-table"><thead><tr><th>Concepto</th><th>Importe</th><th>Pagado</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th></tr></thead><tbody>{f.entries.map(row=><tr key={row.id}><td>{row.concept}</td><td>{money(row.amount)}</td><td>{money(row.paid_amount)}</td><td>{money(Number(row.amount)-Number(row.paid_amount))}</td><td>{row.due_date||'—'}</td><td>{row.status}</td></tr>)}</tbody></table></div>:<Empty>No tienes cargos o pagos registrados todavía.</Empty>}</section></div>;}

function Program({data}){const p=data.program,s=data.student;return <section className="student-panel"><p className="eyebrow">Información académica</p><h2>Mi carrera</h2><div className="student-program">{p?<><span className="program-name">{p.name}</span><p>{p.description||'Sin descripción registrada.'}</p><p><strong>Clave:</strong> {p.code}</p></>:<Empty>Tu programa académico aún no está asignado.</Empty>}<p><strong>Matrícula:</strong> {s.student_number}</p><p><strong>Estado académico:</strong> {s.status}</p><p><strong>Correo:</strong> {s.email||'No registrado'}</p></div></section>;}

function Teachers({data}){return <section className="student-panel"><p className="eyebrow">Equipo académico</p><h2>Mis profesores</h2>{data.teachers.length?<div className="teacher-grid">{data.teachers.map(t=><article className="teacher-card" key={t.id}><strong>{t.name}</strong><span>{t.email||'Correo institucional no registrado'}</span></article>)}</div>:<Empty>Tus profesores aparecerán cuando se asignen docentes a tus grupos.</Empty>}</section>;}

export default function StudentPortal({view='overview',user}){
  const remote=useRemote(load);
  if(remote.loading)return <LoadingState label="Cargando tu aula virtual…"/>;
  if(remote.error)return <ErrorState message={remote.error} onRetry={remote.refresh}/>;
  const data=remote.data;
  if(view==='classes')return <Classes data={data}/>;
  if(view==='progress')return <Progress data={data}/>;
  if(view==='finance')return <Finance data={data}/>;
  if(view==='program')return <Program data={data}/>;
  if(view==='teachers')return <Teachers data={data}/>;
  return <Overview data={data} user={user}/>;
}
