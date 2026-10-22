import { useRemote } from '../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../components/feedback/AsyncState.jsx';
import { read } from './api.js';
const load=signal=>read('/dashboard',signal);
const labels={active_students:'Alumnos activos',active_employees:'Personal activo',active_processes:'Procesos activos',open_requests:'Trámites abiertos',open_cases:'Casos estudiantiles',indicators_on_target:'Indicadores en meta',indicators_below_target:'Indicadores fuera de meta',indicators_without_measurement:'Sin medición'};
export default function Dashboard({ user }) {
  const remote=useRemote(load);
  return <section><div className="page-heading"><div><p className="eyebrow">Instituto de Ciencias Médicas San Angelo</p><h1>Tu institución, en perspectiva.</h1><p>Hola, {user.name}. Información operativa dentro de tu alcance autorizado.</p></div><span className="brand-badge">ICMSA OS</span></div>
    {remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error} onRetry={remote.refresh}/>:<>
      <div className="metrics">{Object.entries(labels).filter(([key])=>remote.data[key]!==null).map(([key,label])=><article className="metric" key={key}><span>{label}</span><strong>{remote.data[key]}</strong><small>Información registrada</small></article>)}</div>
      {remote.data.attendance&&<section className="panel"><h2>Asistencia del día</h2><div className="metrics compact">{Object.entries({present:'Presentes',absent:'Ausentes',late:'Retardos',incidents:'Incidencias',attendance_percentage:'Asistencia %'}).map(([key,label])=><article key={key}><span>{label}</span><strong>{remote.data.attendance[key]??'—'}</strong></article>)}</div><p className="muted">{remote.data.attendance.denominator}</p></section>}
      <div className="two-columns">{[['processes_by_department','Procesos por departamento'],['requests_by_status','Solicitudes por estado']].map(([key,title])=><section key={key} className="panel"><h2>{title}</h2>{remote.data[key].length?<ul className="summary-list">{remote.data[key].map(item=><li key={item.key}><span>{item.key}</span><strong>{item.count}</strong></li>)}</ul>:<p className="muted">Todavía no hay registros disponibles.</p>}</section>)}</div>
      <div className="two-columns"><section className="panel"><h2>Asistencia reciente</h2>{remote.data.recent_attendance.length?<ul>{remote.data.recent_attendance.map(row=><li key={row.id}>{row.date} · Empleado #{row.employee_id} · {row.status}</li>)}</ul>:<p>Sin asistencia registrada.</p>}</section>
      <section className="panel"><h2>Actividad reciente</h2>{remote.data.recent_activity.length?<ul>{remote.data.recent_activity.map((row,i)=><li key={i}>{row.action} · {row.entity_type} · {new Date(row.created_at+'Z').toLocaleString()}</li>)}</ul>:<p>Las operaciones aparecerán aquí cuando se registren.</p>}</section></div>
      <p className="muted">{remote.data.indicator_policy}</p>
    </>}
  </section>;
}
