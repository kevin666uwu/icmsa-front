import { useCallback, useState } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { navigate } from '../../app/router/navigation.js';
import { read } from '../api.js';

const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(value || 0));
const percent=value=>value==null?'Sin datos':`${Number(value).toLocaleString('es-MX',{maximumFractionDigits:2})}%`;
const labels={active:'Activos',inactive:'Inactivos',withdrawn:'Bajas',graduated:'Egresados',applicant:'Aspirantes',received:'Recibidas',in_review:'En revisión',contacted:'Contactadas',accepted:'Aceptadas',rejected:'No aceptadas',completed:'Concluidos',cancelled:'Cancelados',open:'Abiertas',in_progress:'En seguimiento',closed:'Cerradas',present:'Asistencias',late:'Retardos',absent:'Faltas',justified:'Justificadas',draft:'Borradores',review:'En revisión',leave:'En licencia',terminated:'Bajas'};
const sum=object=>Object.values(object || {}).reduce((total,value)=>total+Number(value),0);

function Metric({label,value,detail}) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>;
}
function Distribution({title,values}) {
  if(values==null)return null;
  const total=sum(values);
  return <section className="panel school-report-panel"><h2>{title}</h2>{total ? <ul className="school-report-distribution">{Object.entries(values).map(([key,value])=><li key={key}><div><span>{labels[key] || key}</span><strong>{value}</strong></div><progress aria-label={`${title}: ${labels[key] || key}`} value={value} max={total}/></li>)}</ul> : <p className="muted">Sin registros disponibles.</p>}</section>;
}
function dateNow() {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=type=>parts.find(item=>item.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function RetentionPage() {
  const [filters,setFilters]=useState(()=>({start_date:dateNow().slice(0,8)+'01',end_date:dateNow(),program_id:'',q:'',absence_threshold:'3'}));
  const [draft,setDraft]=useState(filters),[offset,setOffset]=useState(0);
  const loader=useCallback(signal=>read('/operations/retention?'+new URLSearchParams({...Object.fromEntries(Object.entries(filters).filter(([,value])=>value!=='')),offset,limit:25}),signal),[filters,offset]);
  const remote=useRemote(loader),data=remote.data;
  function field(key,value){setDraft(previous=>({...previous,[key]:value}));}
  return <section className="operations-page school-reports">
    <div className="page-heading"><div><p className="eyebrow">Operación</p><h1>Retención</h1><p>Mide la continuidad del alumnado y detecta señales para dar seguimiento oportuno.</p></div></div>
    <form className="toolbar school-report-filters" onSubmit={event=>{event.preventDefault();setOffset(0);setFilters({...draft});}}>
      <label>Desde<input required type="date" value={draft.start_date} max={draft.end_date} onChange={event=>field('start_date',event.target.value)}/></label>
      <label>Hasta<input required type="date" value={draft.end_date} min={draft.start_date} max={dateNow()} onChange={event=>field('end_date',event.target.value)}/></label>
      <label>Programa<select value={draft.program_id} onChange={event=>field('program_id',event.target.value)}><option value="">Todos los programas</option>{(data?.programs || []).map(program=><option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
      <label>Faltas para seguimiento<input required type="number" min="1" max="30" value={draft.absence_threshold} onChange={event=>field('absence_threshold',event.target.value)}/></label>
      <label>Buscar alumno o matrícula<input maxLength={120} value={draft.q} onChange={event=>field('q',event.target.value)}/></label>
      <button className="button primary">Aplicar filtros</button>
    </form>
    {remote.loading ? <LoadingState/> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh}/> : <>
      <div className="metrics school-report-metrics">
        <Metric label="Alumnos activos" value={data.distribution.active || 0}/>
        <Metric label="Alumnos inactivos" value={data.distribution.inactive || 0}/>
        <Metric label="Bajas registradas" value={data.distribution.withdrawn || 0}/>
        <Metric label="Permanencia actual" value={percent(data.current_permanence)} detail="Activos ÷ (activos + inactivos + bajas)"/>
      </div>
      <section className="panel"><h2>Retención de la cohorte del periodo</h2><div className="metrics compact">
        <Metric label="Retención" value={percent(data.cohort.retention_rate)}/><Metric label="Activos al inicio" value={data.cohort.initial}/>
        <Metric label="Activos al cierre" value={data.cohort.active_at_end}/><Metric label="Egresados de la cohorte" value={data.cohort.graduated}/><Metric label="Sin continuidad" value={data.cohort.not_continuing}/>
      </div><p className="muted">Se consideran los alumnos observados como activos antes del inicio del periodo. Retención = quienes siguen activos o egresaron al cierre ÷ alumnos de esa cohorte. Los ingresos posteriores no aumentan este porcentaje.</p>
      {!data.cohort.initial && <p role="status" className="notice">No hay una cohorte observada al inicio del periodo seleccionado. El historial comienza {data.tracking_since ? `el ${new Date(data.tracking_since+'Z').toLocaleDateString('es-MX',{timeZone:'America/Mexico_City'})}` : 'cuando se registren alumnos'}. No se reconstruyen estados anteriores.</p>}</section>
      <Distribution title="Estado actual del alumnado" values={data.distribution}/>
      <section className="panel"><div className="page-heading"><div><h2>Alumnos para seguimiento</h2><p>Señales actuales de inactividad, incidencias abiertas{data.finance_visible?', saldo vencido':''} y faltas registradas en el periodo. Son criterios de atención, no una predicción de abandono.</p></div><button type="button" className="button secondary" onClick={()=>navigate('/portal/operacion/alumnado')}>Abrir alumnado</button></div>
        {data.items.length ? <div className="table-scroll"><table className="responsive-table"><caption>{data.total} alumnos con señales de seguimiento</caption><thead><tr><th>Alumno</th><th>Estado</th><th>Señales</th><th>Faltas</th><th>Incidencias</th>{data.finance_visible && <th>Saldo vencido</th>}</tr></thead><tbody>{data.items.map(student=><tr key={student.id}><td data-label="Alumno">{student.name}<br/><small>{student.student_number}</small></td><td data-label="Estado">{labels[student.status]}</td><td data-label="Señales">{student.signals.join(' · ')}</td><td data-label="Faltas">{student.absences}</td><td data-label="Incidencias">{student.incidents}</td>{data.finance_visible && <td data-label="Saldo vencido">{money(student.overdue)}</td>}</tr>)}</tbody></table></div> : <p className="muted">No hay alumnos con señales según los criterios seleccionados. La ausencia de registros de asistencia no se interpreta como asistencia.</p>}
        <div className="pagination"><button disabled={!offset} onClick={()=>setOffset(value=>Math.max(0,value-25))}>Anterior</button><span>Página {offset/25+1}</span><button disabled={offset+25>=data.total} onClick={()=>setOffset(value=>value+25)}>Siguiente</button></div>
      </section>
    </>}
  </section>;
}

export function SchoolIndicatorsPage() {
  const loader=useCallback(signal=>read('/operations/school-indicators',signal),[]);
  const remote=useRemote(loader),data=remote.data;
  const attendance=data?.student_attendance;
  const denominator=(attendance?.present || 0)+(attendance?.late || 0)+(attendance?.absent || 0);
  return <section className="operations-page school-reports">
    <div className="page-heading"><div><p className="eyebrow">Operación</p><h1>Indicadores</h1><p>La información de la escuela en un resumen, según tus permisos y alcance de consulta.</p></div><button type="button" className="button secondary" onClick={remote.refresh}>Actualizar</button></div>
    {remote.loading ? <LoadingState/> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh}/> : <>
      <p className="muted">Corte: {data.as_of}. Cifras acumuladas de los registros actuales; asistencia del alumnado de los últimos 30 días.</p>
      <div className="metrics school-report-metrics">
        {data.students && <Metric label="Alumnos activos" value={data.students.active || 0}/>}
        {data.admissions && <Metric label="Admisiones pendientes" value={['received','in_review','contacted'].reduce((count,status)=>count+(data.admissions[status] || 0),0)}/>}
        {data.placements && <Metric label="Servicio social y prácticas en trámite" value={['received','in_review','active'].reduce((count,status)=>count+(data.placements[status] || 0),0)}/>}
        {data.incidents && <Metric label="Incidencias abiertas" value={(data.incidents.open || 0)+(data.incidents.in_progress || 0)}/>}
        {data.employees && <Metric label="Personal activo" value={data.employees.active || 0}/>}
        {data.processes && <Metric label="Procesos activos" value={data.processes.active || 0}/>}
        {attendance && <Metric label="Asistencia registrada" value={percent(denominator ? 100*((attendance.present || 0)+(attendance.late || 0))/denominator : null)} detail="(Asistencias + retardos) ÷ (asistencias + retardos + faltas). Justificaciones excluidas."/>}
      </div>
      {data.finance && <section className="panel"><h2>Resumen financiero · MXN</h2><div className="metrics school-report-metrics">{[['Dinero recibido','received'],['Cobros pendientes','balance'],['Saldo vencido','overdue'],['Gastos pagados','paid_expenses'],['Gastos por pagar','pending_expenses'],['Flujo neto registrado','net']].map(([label,key])=><Metric key={key} label={label} value={money(data.finance[key])}/>)}</div><p className="muted">Flujo neto = abonos recibidos − gastos pagados.</p></section>}
      <div className="two-columns">{[['students','Alumnado'],['admissions','Admisión'],['placements','Servicio social y prácticas'],['incidents','Incidencias'],['employees','Personal'],['processes','Procesos'],['student_attendance','Asistencia del alumnado · 30 días']].map(([key,title])=><Distribution key={key} title={title} values={data[key]}/>)}</div>
      <section className="panel"><h2>Última medición de indicadores institucionales</h2>{data.measurements.length ? <div className="table-scroll"><table className="responsive-table"><thead><tr><th>Indicador</th><th>Periodo</th><th>Valor</th><th>Meta</th><th>Valor/meta</th></tr></thead><tbody>{data.measurements.map(item=><tr key={item.id}><td data-label="Indicador">{item.name}</td><td data-label="Periodo">{item.period || 'Sin medición'}</td><td data-label="Valor">{item.value==null?'—':`${item.value} ${item.unit || ''}`}</td><td data-label="Meta">{item.target ?? '—'}</td><td data-label="Valor/meta">{percent(item.compliance)}</td></tr>)}</tbody></table></div> : <p className="muted">Todavía no hay indicadores institucionales activos.</p>}<p className="muted">La relación valor/meta no determina por sí sola si el resultado es favorable: depende del sentido de mejora de cada indicador.</p></section>
    </>}
  </section>;
}
