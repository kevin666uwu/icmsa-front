import { useCallback, useState } from 'react';
import { useRemote } from '../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../components/feedback/AsyncState.jsx';
import { read, displayName } from './api.js';
import ResourceForm from './ResourceForm.jsx';
import ProcessDetail from './processes/ProcessDetail.jsx';
import IndicatorHistory from './indicators/IndicatorHistory.jsx';
import EmployeeDetail from './organization/EmployeeDetail.jsx';

export default function ResourcePage({ name, spec, access, fixedStatus, visibleFields, description, showDetails = true }) {
  const [q, setQ] = useState(''), [status, setStatus] = useState(fixedStatus || ''), [sort, setSort] = useState('id');
  const [offset, setOffset] = useState(0), [edit, setEdit] = useState(undefined), [detail, setDetail] = useState(null), [notice, setNotice] = useState('');
  const loader = useCallback(signal => read(spec.path + '?' + new URLSearchParams({ q, status, sort, offset, limit: 25 }), signal), [spec, q, status, sort, offset]);
  const remote = useRemote(loader);
  const canWrite = access.permissions.includes(spec.permission + '.write');
  const contextHelp = {
    areas: 'Las áreas funcionales son opcionales: sirven para clasificar actividades. No necesitas crear una por cada puesto o responsable.',
    positions: 'Cada puesto pertenece a un departamento y puede depender directamente de él. El área funcional es opcional; la jerarquía se configura con el superior inmediato.',
    processes: 'Cada proceso pertenece a un departamento. Una misma persona puede responsabilizarse de varios procesos sin crear puestos ni áreas adicionales.',
  };
  const fields = visibleFields ? visibleFields.filter(key => spec.fields[key]).map(key => [key, spec.fields[key]]) : Object.entries(spec.fields).filter(([key]) => !['description', 'notes', 'curp', 'phone', 'email', 'user_id'].includes(key)).slice(0, 5);
  function changed(setter, value) { setter(value); setOffset(0); }
  return <section>
    <div className="page-heading"><div><p className="eyebrow">ICMSA · Operación institucional</p><h1>{spec.title}</h1><p>{description || contextHelp[name] || 'Consulta y administra los registros dentro de tu alcance autorizado.'}</p></div>{canWrite && <button className="button primary" onClick={() => setEdit(null)}>Agregar</button>}</div>
    {notice && <p className="notice" role="status">{notice}</p>}
    <div className="toolbar"><label>Buscar<input value={q} onChange={e => changed(setQ, e.target.value)} placeholder="Buscar registros…" /></label>
      {!fixedStatus && spec.fields.status?.choices && <label>Estado<select value={status} onChange={e => changed(setStatus, e.target.value)}><option value="">Todos</option>{spec.fields.status.choices.map(s => <option key={s} value={s}>{spec.fields.status.choice_labels?.[s] || s}</option>)}</select></label>}
      <label>Ordenar<select value={sort} onChange={e => changed(setSort, e.target.value)}><option value="id">Registro</option>{fields.map(([key, field]) => <option key={key} value={key}>{field.label}</option>)}</select></label>
    </div>
    {remote.loading ? <LoadingState /> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh} /> : remote.data?.items.length ?
      <><div className="table-scroll"><table className="responsive-table"><caption>{spec.title} · {remote.data.total} registros</caption><thead><tr>{fields.map(([key, field]) => <th key={key}>{field.label}</th>)}<th>Acciones</th></tr></thead><tbody>{remote.data.items.map(row =>
        <tr key={row.id}>{fields.map(([key]) => <td key={key} data-label={spec.fields[key].label}>{typeof row[key] === 'boolean' ? row[key] ? 'Sí' : 'No' : (spec.fields[key].choice_labels?.[row[key]] || row[key]) ?? '—'}</td>)}<td data-label="Acciones"><div className="row-actions">{showDetails && ['processes','indicators','employees'].includes(name) && <button onClick={() => setDetail(row)}>Ver detalle</button>}{canWrite && <button onClick={() => setEdit(row)} aria-label={'Editar ' + displayName(row)}>Editar</button>}</div></td></tr>)}</tbody></table></div>
        <div className="pagination"><button disabled={!offset} onClick={() => setOffset(v => Math.max(0, v - 25))}>Anterior</button><span>Página {offset / 25 + 1} · {remote.data.total} registros</span><button disabled={offset + 25 >= remote.data.total} onClick={() => setOffset(v => v + 25)}>Siguiente</button></div></> :
      <div className="empty-panel"><span className="empty-symbol" aria-hidden="true">◇</span><h2>Sin registros disponibles</h2><p>{q || status ? 'Ajusta los filtros para ampliar la búsqueda.' : 'Aquí se mostrará la información institucional cuando se registre.'}</p>{canWrite && <button className="button secondary" onClick={() => setEdit(null)}>Crear primer registro</button>}</div>}
    {edit !== undefined && <ResourceForm spec={spec} access={access} record={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); setNotice('Cambios guardados.'); remote.refresh(); }} />}
    {detail && name === 'processes' && <ProcessDetail record={detail} access={access} onClose={() => setDetail(null)} />}
    {detail && name === 'indicators' && <IndicatorHistory record={detail} canWrite={canWrite} onClose={() => setDetail(null)} />}
    {detail && name === 'employees' && <EmployeeDetail record={detail} access={access} onClose={() => setDetail(null)} />}
  </section>;
}

