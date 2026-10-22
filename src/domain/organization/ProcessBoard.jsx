import { useState } from 'react';
import { moveProcess } from './processBoard.js';
export default function ProcessBoard({ processes, initial, onSave, busy = false }) {
  const [draft, setDraft] = useState(initial);
  const lanes = [['available', 'Lista de procesos'], ['responsible', 'Procesos responsables'], ['related', 'Procesos relacionados']];
  const move = (id, lane) => { if (processes.some(p => p.id === id)) setDraft(v => moveProcess(v, id, lane)); };
  function laneFor(id) { return draft.responsible_ids.includes(id) ? 'responsible' : draft.related_ids.includes(id) ? 'related' : 'available'; }
  return <div><p>Arrastra un proceso o utiliza su selector para cambiar la asignación directa. La participación heredada del puesto y área se conserva.</p>
    <div className="process-board">{lanes.map(([lane, title]) => <section key={lane} aria-label={title} className="process-lane"
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) move(Number(e.dataTransfer.getData('text/plain')), lane); }}>
      <h3>{title}</h3>{processes.filter(p => laneFor(p.id) === lane).map(p => <article key={p.id} draggable={!busy}
        onDragStart={e => e.dataTransfer.setData('text/plain', String(p.id))}><strong>{p.name}</strong>
        <label>Mover {p.name}<select disabled={busy} value={lane} onChange={e => move(p.id, e.target.value)}>{lanes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></article>)}
      {!processes.some(p => laneFor(p.id) === lane) && <p className="muted">Sin procesos en esta columna.</p>}
    </section>)}</div><button className="button primary" disabled={busy} onClick={() => onSave(draft)}>{busy ? 'Guardando…' : 'Guardar asignaciones'}</button>
  </div>;
}
