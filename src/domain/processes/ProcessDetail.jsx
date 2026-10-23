import { useCallback, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { read, write } from '../api.js';
import ProcessAssignments from './ProcessAssignments.jsx';

function StepsEditor({ initial, onSave, busy }) {
  const [steps, setSteps] = useState(initial.map(({name,description,employee_id,position_id,sort_order}) => ({name,description,employee_id,position_id,sort_order})));
  return <form onSubmit={e => { e.preventDefault(); onSave(steps.map((step, sort_order) => ({...step, sort_order}))); }}>
    {steps.map((step, index) => <fieldset key={index}><legend>Paso {index + 1}</legend>
      <label>Nombre del paso<input required value={step.name} onChange={e => setSteps(items => items.map((s, i) => i === index ? {...s, name:e.target.value} : s))} /></label>
      <label>Descripción<textarea value={step.description || ''} onChange={e => setSteps(items => items.map((s, i) => i === index ? {...s, description:e.target.value} : s))} /></label>
      <button type="button" onClick={() => setSteps(items => items.filter((_, i) => i !== index))}>Eliminar paso {index + 1}</button>
      {index > 0 && <button type="button" onClick={() => setSteps(items => { const next=[...items]; [next[index-1],next[index]]=[next[index],next[index-1]]; return next; })}>Subir paso</button>}
    </fieldset>)}
    <button type="button" onClick={() => setSteps(items => [...items, {name:'',description:''}])}>Agregar paso</button>
    <button className="button primary" disabled={busy}>Guardar pasos</button>
  </form>;
}
export default function ProcessDetail({ record, access, onClose }) {
  const loader = useCallback(signal => read('/processes/' + record.id + '/steps', signal), [record.id]);
  const capabilitiesLoader = useCallback(signal => read('/processes/' + record.id + '/capabilities', signal), [record.id]);
  const capabilities = useRemote(capabilitiesLoader);
  const remote = useRemote(loader), action = useAction(), [editing, setEditing] = useState(false), [notice, setNotice] = useState('');
  const canWrite = capabilities.data?.edit === true;
  return <Modal title={record.name} onClose={onClose}>
    <p className="eyebrow">Proceso · {record.status} · Versión {record.version}</p><p>{record.description || 'Sin descripción registrada.'}</p>
    {notice && <p role="status">{notice}</p>}
    <h3>Pasos del proceso</h3>
    {remote.loading ? <LoadingState /> : remote.error ? <ErrorState message={remote.error} /> : <>
      {editing ? <StepsEditor initial={remote.data} busy={action.busy} onSave={steps => action.run(async () => { await write('/processes/' + record.id + '/steps', steps, 'PUT'); setEditing(false); setNotice('Pasos actualizados.'); remote.refresh(); })} /> :
        remote.data.length ? <ol>{remote.data.map(step => <li key={step.id}><strong>{step.name}</strong><p>{step.description}</p></li>)}</ol> : <p className="muted">Este proceso todavía no tiene pasos documentados.</p>}
      {canWrite && <button onClick={() => setEditing(v => !v)}>{editing ? 'Cancelar' : 'Editar pasos'}</button>}
    </>}
    {action.error && <ErrorState message={action.error} />}
    {capabilities.data?.manage && <ProcessAssignments processId={record.id} access={access} />}
  </Modal>;
}
