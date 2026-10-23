import { useCallback, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { read, write, displayName, allRecords } from '../api.js';
import ProcessBoard from './ProcessBoard.jsx';
export default function EmployeeDetail({ record, access, onClose }) {
  const loader = useCallback(async signal => {
    const [overview, processes] = await Promise.all([read('/employees/' + record.id + '/processes', signal), allRecords('/processes', signal)]);
    return { overview, processes };
  }, [record.id]);
  const remote = useRemote(loader), action = useAction();
  const [editing, setEditing] = useState(false), [notice, setNotice] = useState('');
  const canEdit = access.permissions.includes('employees.write') && access.permissions.includes('processes.write');
  return <Modal title={displayName(record)} onClose={onClose}>
    <p>Empleado #{record.id} · {record.employee_number} · {record.status}</p>
    {notice && <p role="status">{notice}</p>}
    {remote.loading ? <LoadingState /> : remote.error ? <ErrorState message={remote.error} /> : <>
      {Object.entries({ responsible:'Responsable', related:'Participación', by_position:'Por mi puesto', by_area:'Por mi área' }).map(([key, label]) =>
        <section key={key}><h3>{label}</h3>{remote.data.overview[key].length ? <ul>{remote.data.overview[key].map(p => <li key={p.id}>{p.name} · {p.permission}</li>)}</ul> : <p className="muted">Sin procesos asignados.</p>}</section>)}
      {canEdit && <button onClick={() => setEditing(v => !v)}>{editing ? 'Cancelar edición' : 'Editar procesos'}</button>}
      {editing && <ProcessBoard processes={remote.data.processes} initial={{
        responsible_ids: remote.data.overview.direct_records.filter(p => p.is_responsible).map(p => p.id),
        related_ids: remote.data.overview.direct_records.filter(p => !p.is_responsible).map(p => p.id) }}
        busy={action.busy} onSave={draft => action.run(async () => { await write('/employees/' + record.id + '/processes', draft, 'PUT'); setEditing(false); setNotice('Asignaciones guardadas.'); remote.refresh(); })} />}
    </>}{action.error && <ErrorState message={action.error} />}
  </Modal>;
}
