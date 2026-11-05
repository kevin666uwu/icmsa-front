import { useState } from 'react';
import { read, write, displayName } from '../api.js';
import { useAction } from '../../hooks/useRemote.js';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import ResourceForm from '../ResourceForm.jsx';

/**
 * Catálogos institucionales dentro de Organigrama.
 * No se cambian ni duplican registros: se reutilizan los CRUD existentes.
 */
export default function OrgDirectory({ maps, access, onSaved, onPositionSelect }) {
  const action=useAction();
  const [editing,setEditing]=useState(null);
  const [fetching,setFetching]=useState(false);
  const [loadError,setLoadError]=useState('');
  const permissions=access.permissions||[];
  const canManageOrganization=permissions.includes('organization.write');
  const canManageEmployees=permissions.includes('employees.write');
  const areas=[...maps.areas.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const employees=[...maps.employees.values()].sort((a,b)=>displayName(a).localeCompare(displayName(b),'es'));
  const positions=[...maps.positions.values()].sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const vacancies=positions.filter(p=>p.active!==false&&!maps.occupants.has(p.id));
  const inactive=positions.filter(p=>p.active===false);
  const fieldSpec=key=>access.resources?.[key];

  async function edit(key,id=null) {
    if(!fieldSpec(key))return;
    setLoadError('');setFetching(true);
    try {
      // GET the full authorized record; /organization deliberately omits sensitive attributes.
      const record=id===null?null:await read(fieldSpec(key).path+'/'+id);
      setEditing({key,record});
    }catch(error){setLoadError(error.message||'No fue posible consultar el registro.');}
    finally{setFetching(false);}
  }
  async function reactivate(position) {
    await action.run(async()=>{
      await write('/positions/'+position.id,{active:true},'PATCH');
      onSaved('Puesto reactivado.');
    });
  }
  return <details className="org-directory" aria-label="Gestión organizacional">
    <summary className="org-directory-summary">
      <span><strong>Gestionar áreas, personal y vacantes</strong><small>Áreas, personal y plazas en un mismo lugar</small></span>
      <span className="org-directory-summary-count">{vacancies.length} vacantes</span>
    </summary>
    <p className="org-directory-intro">Estas son funciones internas de Organigrama, no apartados independientes del menú. El puesto determina la jerarquía; las áreas solo clasifican funciones y los procesos se gestionan en su módulo.</p>
    {(loadError||action.error)&&<ErrorState message={loadError||action.error}/>}
    {fetching&&<p role="status">Abriendo registro…</p>}
    <div className="org-directory-sections">
      <section className="org-directory-section">
        <header><div><h3>Áreas funcionales</h3><small>{areas.length} áreas (opcionales)</small></div>
          {canManageOrganization&&<button type="button" onClick={()=>edit('areas')}>Agregar</button>}</header>
        <div className="org-directory-records">{areas.map(a=><div className="org-directory-record" key={a.id}>
          <div><strong>{a.name}</strong><small>{maps.departments.get(a.department_id)?.name||'Departamento'} · {a.active===false?'Inactiva':'Activa'}</small></div>
          {canManageOrganization&&<button type="button" onClick={()=>edit('areas',a.id)}>Editar</button>}
        </div>)}</div>
      </section>
      {permissions.includes('employees.read')&&<section className="org-directory-section">
        <header><div><h3>Personal</h3><small>{employees.length} expedientes</small></div>
          {canManageEmployees&&access.role==='super_admin'&&<button type="button" onClick={()=>edit('employees')}>Agregar</button>}</header>
        <div className="org-directory-records">{employees.map(e=><div className="org-directory-record" key={e.id}>
          <div><strong>{displayName(e)}</strong><small>{e.status||'Sin estatus'}</small></div>
          {canManageEmployees&&<button type="button" onClick={()=>edit('employees',e.id)}>Editar</button>}
        </div>)}</div>
      </section>}
      <section className="org-directory-section">
        <header><div><h3>Puestos y vacantes</h3><small>{positions.length} puestos · {vacancies.length} vacantes</small></div>
          {canManageOrganization&&<button type="button" onClick={()=>edit('positions')}>Agregar</button>}</header>
        <div className="org-directory-records">{positions.map(p=><div className="org-directory-record" key={p.id}>
          <div><strong>{p.name}</strong><small>{maps.departments.get(maps.positionDepartment(p))?.name||'Departamento'} · {p.active===false?'Inactivo':maps.occupants.get(p.id)?displayName(maps.occupants.get(p.id)):'Vacante'}</small></div>
          {canManageEmployees&&canManageOrganization&&<button type="button" onClick={()=>onPositionSelect(p)}>Editar plaza</button>}
          {canManageOrganization&&p.active===false&&<button type="button" onClick={()=>reactivate(p)} disabled={action.busy}>Reactivar</button>}
        </div>)}</div>
        {inactive.length>0&&<p className="org-directory-footnote">Los puestos inactivos se conservan para consulta y pueden reactivarse; no se eliminan expedientes ni historiales.</p>}
      </section>
    </div>
    {editing&&<ResourceForm key={editing.key+'-'+(editing.record?.id||'new')}
      spec={fieldSpec(editing.key)} access={access} record={editing.record}
      onClose={()=>setEditing(null)}
      onSaved={()=>{setEditing(null);onSaved('Catálogo organizacional actualizado.');}}/>}
  </details>;
}
