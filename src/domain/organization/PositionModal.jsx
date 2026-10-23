import { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useAction } from '../../hooks/useRemote.js';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import { write, displayName } from '../api.js';
export default function PositionModal({ position, maps, canEdit, onClose, onSaved }) {
  const occupant = maps.occupants.get(position.id);
  const [name, setName] = useState(position.name), [area, setArea] = useState(position.area_id);
  const [parent, setParent] = useState(position.parent_position_id || ''), [employee, setEmployee] = useState(occupant?.id || '');
  const action = useAction(), overview = maps.overview[String(occupant?.id)];
  return <Modal title={position.name + ' · ' + (occupant ? displayName(occupant) : 'VACANTE')} onClose={onClose}>
    <p>{maps.areas.get(position.area_id)?.name} · {maps.departments.get(maps.areas.get(position.area_id)?.department_id)?.name}</p>
    <p>Superior inmediato: {maps.positions.get(position.parent_position_id)?.name || 'Sin superior'}</p>
    <h3>Procesos responsables</h3><ul>{overview?.responsible.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    <h3>Procesos relacionados</h3><ul>{overview?.related.map(p => <li key={p.id}>{p.name}</li>)}</ul>
    {canEdit && <form className="entity-form" onSubmit={event => { event.preventDefault(); action.run(async () => {
      await write('/positions/' + position.id + '/editor', { name, area_id: Number(area), parent_position_id: parent ? Number(parent) : null, employee_id: employee ? Number(employee) : null }, 'PUT');
      onSaved();
    }); }}>
      <label>Puesto<input required value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Área<select value={area} onChange={e => setArea(e.target.value)}>{[...maps.areas.values()].map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label>Superior inmediato<select value={parent} onChange={e => setParent(e.target.value)}><option value="">Sin superior</option>{[...maps.positions.values()].filter(p => p.id !== position.id).map(p => <option key={p.id} value={p.id}>{p.name} · #{p.id}</option>)}</select></label>
      <label>Ocupante<select value={employee} onChange={e => setEmployee(e.target.value)}><option value="">Vacante</option>{[...maps.employees.values()].filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{displayName(e)}</option>)}</select></label>
      {action.error && <ErrorState message={action.error} />}<p className="muted">La reasignación conserva el historial. La ficha y el ocupante se guardan en una sola operación.</p>
      <button className="button primary" disabled={action.busy}>{action.busy ? 'Guardando…' : 'Guardar cambios'}</button>
    </form>}
  </Modal>;
}
