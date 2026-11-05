import { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useAction } from '../../hooks/useRemote.js';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import { write } from '../api.js';
import ResourceForm from '../ResourceForm.jsx';

export default function DepartmentManager({ maps, access, onSaved }) {
  const [editing,setEditing]=useState(undefined);
  const [deleting,setDeleting]=useState(null);
  const [confirmation,setConfirmation]=useState('');
  const action=useAction();
  const canManage=access.role==='super_admin' && access.permissions?.includes('organization.write');
  const spec=access.resources?.departments;
  const departments=[...maps.departments.values()].sort(
    (a,b)=>(a.sort_order??0)-(b.sort_order??0)||a.name.localeCompare(b.name,'es')
  );
  const hasConfirmed=deleting && confirmation.trim()===deleting.name;
  const closeDelete=()=>{if(!action.busy){setDeleting(null);setConfirmation('');}};

  const confirmDelete=event=>{
    event.preventDefault();
    if(!deleting || !hasConfirmed)return;
    action.run(async()=>{
      await write('/departments/'+deleting.id,undefined,'DELETE');
      setDeleting(null);
      setConfirmation('');
      onSaved('Departamento eliminado. La operación quedó registrada en auditoría.');
    });
  };
  const deactivate=()=>action.run(async()=>{
    if(!deleting)return;
    await write('/departments/'+deleting.id,{active:false},'PATCH');
    setDeleting(null);
    setConfirmation('');
    onSaved('Departamento desactivado. Su información y relaciones se conservaron.');
  });

  return <section className="org-departments" aria-labelledby="org-departments-heading">
    <header className="org-departments-header">
      <div>
        <span className="eyebrow">ESTRUCTURA INSTITUCIONAL</span>
        <h2 id="org-departments-heading">Departamentos</h2>
        <p>Crea y administra las unidades de la institución desde Organigrama. Las áreas y los procesos pueden depender de cada departamento.</p>
      </div>
      {canManage && spec && <button type="button" className="button primary" onClick={()=>setEditing(null)}>+ Agregar departamento</button>}
    </header>
    {departments.length
      ? <div className="org-department-grid">
        {departments.map(department=>{
          const areaCount=[...maps.areas.values()].filter(a=>a.department_id===department.id).length;
          const positionCount=[...maps.positions.values()].filter(p=>maps.positionDepartment(p)===department.id).length;
          const processCount=(maps.processes||[]).filter(p=>p.department_id===department.id).length;
          return <article className="org-department-card" key={department.id}>
            <div className="org-department-card-heading">
              <h3>{department.name}</h3>
              <span className={department.active===false?'org-department-status inactive':'org-department-status'}>{department.active===false?'Inactivo':'Activo'}</span>
            </div>
            {department.description&&<p>{department.description}</p>}
            <div className="org-department-counts">
              <span>{areaCount} áreas</span>
              <span>{positionCount} puestos</span>
              {access.permissions?.includes('processes.read')&&<span>{processCount} procesos</span>}
            </div>
            {canManage&&spec&&<div className="org-department-actions">
              <button type="button" onClick={()=>setEditing(department)}>Editar</button>
              <button type="button" className="org-department-delete" onClick={()=>{setDeleting(department);setConfirmation('')}}>Eliminar</button>
            </div>}
          </article>;
        })}
      </div>
      : <div className="org-departments-empty">Aún no hay departamentos. {canManage?'Usa «Agregar departamento» para crear el primero.':'Solicita a administración que configure la estructura.'}</div>}
    {!canManage&&<p className="org-departments-access">Solo un superadministrador puede crear, editar y eliminar departamentos.</p>}
    {editing!==undefined && canManage && spec && <ResourceForm key={'department-'+(editing?.id||'new')}
      spec={spec} access={access} record={editing} onClose={()=>setEditing(undefined)}
      onSaved={()=>{setEditing(undefined);onSaved('Departamento guardado correctamente.')}}/>}
    {deleting&&canManage&&<Modal title="Eliminar departamento" onClose={closeDelete}>
      <div className="org-department-delete-warning">
        <p>¿Eliminar definitivamente <strong>{deleting.name}</strong>?</p>
        <p>Si existen áreas, puestos, procesos, permisos, trámites o cualquier otro registro vinculado, ICMSA bloqueará la eliminación para proteger la información. En ese caso puedes desactivar el departamento.</p>
      </div>
      <form className="entity-form" onSubmit={confirmDelete}>
        <label>Escribe <strong>{deleting.name}</strong> para confirmar
          <input type="text" autoComplete="off" spellCheck={false}
            value={confirmation} onChange={event=>setConfirmation(event.target.value)}
            placeholder="Nombre exacto del departamento" />
        </label>
        {action.error&&<ErrorState message={action.error}/>}
        <div className="form-actions">
          <button type="submit" className="org-department-delete-confirm" disabled={action.busy||!hasConfirmed}>
            {action.busy?'Procesando…':'Eliminar definitivamente'}
          </button>
          {deleting.active!==false&&<button type="button" className="button secondary" onClick={deactivate} disabled={action.busy}>Desactivar en su lugar</button>}
          <button type="button" className="button secondary" onClick={closeDelete} disabled={action.busy}>Cancelar</button>
        </div>
      </form>
    </Modal>}
  </section>;
}
