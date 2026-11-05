import { useState } from 'react';
import { useAction } from '../../hooks/useRemote.js';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import { write, displayName } from '../api.js';

const EMPTY = { responsible: [], related: [], direct_records: [] };
const LANES = [
  ['available','Lista de procesos'],
  ['responsible','Procesos del usuario'],
  ['related','Procesos relacionados'],
];

export default function PositionModal({ position, maps, canEdit, canEditProcesses, initialProcessEditor=false, onClose, onSaved }) {
  const occupant=maps.occupants.get(position.id);
  const overview=maps.overview[String(occupant?.id)] || EMPTY;
  const [name,setName]=useState(position.name);
  const [department,setDepartment]=useState(String(maps.positionDepartment(position) ?? ''));
  const [area,setArea]=useState(String(position.area_id || ''));
  const [parent,setParent]=useState(String(position.parent_position_id || ''));
  const [employee,setEmployee]=useState(String(occupant?.id || ''));
  const [editingProcesses,setEditingProcesses]=useState(initialProcessEditor);
  const [processDraft,setProcessDraft]=useState(()=>{
    const direct=overview.direct_records || [];
    return {
      responsible: direct.filter(p=>p.is_responsible).map(p=>p.id),
      related: direct.filter(p=>!p.is_responsible).map(p=>p.id),
    };
  });
  const action=useAction(), processAction=useAction();
  const chosen=maps.employees.get(Number(employee));
  const editOwner=Number(employee)===occupant?.id;
  const processById=new Map(maps.processes.map(p=>[p.id,p]));
  const availableIds=maps.processes.map(p=>p.id).filter(id=>!processDraft.responsible.includes(id)&&!processDraft.related.includes(id));
  const idsByLane={available:availableIds, responsible:processDraft.responsible, related:processDraft.related};
  const moveProcess=(id,lane)=> {
    id=Number(id);
    if (!processById.has(id)) return;
    setProcessDraft(old=>({
      responsible:lane==='responsible'?[...old.responsible.filter(v=>v!==id),id]:old.responsible.filter(v=>v!==id),
      related:lane==='related'?[...old.related.filter(v=>v!==id),id]:old.related.filter(v=>v!==id),
    }));
  };
  const handleDrop=(event,lane)=>{
    event.preventDefault();
    if(!processAction.busy)moveProcess(event.dataTransfer.getData('text/process-id'),lane);
  };
  const savePosition=event=>{
    event.preventDefault();
    action.run(async()=>{
      await write('/positions/'+position.id+'/editor',{
        name,department_id:Number(department),area_id:area?Number(area):null,
        parent_position_id:parent?Number(parent):null,employee_id:employee?Number(employee):null,
      },'PUT');
      onSaved('Puesto actualizado.');
    });
  };
  const saveProcesses=()=>processAction.run(async()=>{
    if(!occupant) return;
    await write('/employees/'+occupant.id+'/processes',{
      responsible_ids:processDraft.responsible,related_ids:processDraft.related,
    },'PUT');
    onSaved('Asignaciones de procesos actualizadas.');
  });
  return <div className="org-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="org-modal" role="dialog" aria-modal="true" aria-label={'Detalle de '+position.name} onMouseDown={event=>event.stopPropagation()}>
      <button type="button" className="org-modal-close" aria-label="Cerrar" onClick={onClose}>×</button>
      <span className="eyebrow">{maps.departments.get(maps.positionDepartment(position))?.name || 'ORGANIZACIÓN'}</span>
      <h3>{occupant ? displayName(occupant) : 'Vacante'}</h3>
      <p className="org-modal-position">{position.name}{position.area_id ? ' · '+(maps.areas.get(position.area_id)?.name || '') : ''}</p>

      {canEdit && <form className="org-inline-editor" onSubmit={savePosition}>
        <h4>Editar puesto</h4>
        <label>Nombre del puesto<input required maxLength={255} value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>Departamento<select required value={department} onChange={e=>{setDepartment(e.target.value);setArea('');setParent('')}}>
          <option value="">Seleccionar departamento</option>
          {[...maps.departments.values()].map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </select></label>
        <label>Área funcional (opcional)<select value={area} onChange={e=>setArea(e.target.value)}>
          <option value="">Puesto directamente en el departamento</option>
          {[...maps.areas.values()].filter(a=>a.department_id===Number(department)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select></label>
        <label>Reporta a<select value={parent} onChange={e=>setParent(e.target.value)}>
          <option value="">Nivel superior / raíz</option>
          {[...maps.positions.values()].filter(p=>p.id!==position.id&&maps.positionDepartment(p)===Number(department)).map(p=><option key={p.id} value={p.id}>{p.name} · {maps.occupants.get(p.id)?displayName(maps.occupants.get(p.id)):'Vacante'}</option>)}
        </select></label>
        <label>Ocupante<select value={employee} onChange={e=>setEmployee(e.target.value)}>
          <option value="">Vacante</option>
          {[...maps.employees.values()].filter(e=>e.status==='active').map(e=><option key={e.id} value={e.id}>{displayName(e)}</option>)}
        </select></label>
        {employee && !editOwner && <p className="org-editor-note">Al asignar a {chosen ? displayName(chosen) : 'otra persona'}, esta debe tener su plaza principal libre. La reasignación desde otra plaza se realiza explícitamente.</p>}
        {action.error&&<ErrorState message={action.error}/>}
        <button type="submit" className="button primary" disabled={action.busy||!department}>{action.busy?'Guardando…':'Guardar cambios'}</button>
      </form>}

      <div className="org-process-title-row">
        <div><span className="eyebrow">PROCESOS</span><h4>Participación en procesos</h4></div>
        {canEditProcesses && occupant && <button type="button" className="org-edit-processes" onClick={()=>setEditingProcesses(v=>!v)}>{editingProcesses?'Cancelar edición':'Editar procesos'}</button>}
      </div>

      {!editingProcesses && <div className="org-process-columns">
        <div><h4>Procesos del usuario <span>{overview.responsible?.length||0}</span></h4>
          {overview.responsible?.length ? overview.responsible.map(p=><div className="org-process-item" key={p.id}><strong>{p.name}</strong><small>Responsable · {p.permission}</small></div>):<p className="muted">No tiene procesos como responsable.</p>}
        </div>
        <div><h4>Procesos relacionados con el usuario <span>{overview.related?.length||0}</span></h4>
          {overview.related?.length ? overview.related.map(p=><div className="org-process-item" key={p.id}><strong>{p.name}</strong><small>Involucrado · {p.permission}</small></div>):<p className="muted">No tiene procesos relacionados.</p>}
        </div>
      </div>}

      {editingProcesses && occupant && canEditProcesses && <div className="org-process-dnd">
        <p className="org-dnd-help">Como en KPIs Web, arrastra cada proceso a la columna que corresponda. También puedes usar el selector para moverlo. Las asignaciones heredadas del puesto o área permanecen.</p>
        <div className="org-process-lanes">
          {LANES.map(([lane,title])=><section key={lane} className={'org-process-lane org-process-lane-'+lane} aria-label={title} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,lane)}>
            <header><strong>{title}</strong><span>{idsByLane[lane].length}</span></header>
            <div className="org-process-lane-list">
              {idsByLane[lane].length ? idsByLane[lane].map(id=>{
                const p=processById.get(id) || {id,name:'Proceso #'+id};
                return <article key={id} className="org-process-drag-card" draggable={!processAction.busy}
                  onDragStart={e=>{e.dataTransfer.setData('text/process-id',String(id));e.dataTransfer.effectAllowed='move'}}>
                  <span className="org-drag-handle" aria-hidden="true">⋮⋮</span>
                  <div><strong>{p.name}</strong><label className="org-process-select-label">Mover proceso
                    <select value={lane} disabled={processAction.busy} onChange={e=>moveProcess(id,e.target.value)}>
                      {LANES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
                    </select>
                  </label></div>
                </article>;
              }) : <div className="org-process-drop-empty">Suelta procesos aquí</div>}
            </div>
          </section>)}
        </div>
        {processAction.error && <ErrorState message={processAction.error}/>}
        <div className="org-process-dnd-actions"><button type="button" className="button primary" onClick={saveProcesses} disabled={processAction.busy}>{processAction.busy?'Guardando…':'Guardar procesos'}</button></div>
      </div>}
    </section>
  </div>;
}
