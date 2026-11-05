import { useMemo, useState } from 'react';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read, write, displayName } from '../api.js';
import PositionTree from './PositionTree.jsx';
import PositionModal from './PositionModal.jsx';
import { organizationMaps } from './organizationMaps.js';

const loadOrganization=signal=>read('/organization',signal);
const initialStaff={first_name:'',last_name:'',employee_number:''};

export default function OrganizationPage({ access }) {
  const remote=useRemote(loadOrganization);
  const action=useAction();
  const [notice,setNotice]=useState('');
  const [selected,setSelected]=useState(null);
  const [staff,setStaff]=useState(initialStaff);
  const [areaName,setAreaName]=useState(''),[areaDepartment,setAreaDepartment]=useState('');
  const [positionName,setPositionName]=useState(''),[positionDepartment,setPositionDepartment]=useState(''),[positionArea,setPositionArea]=useState(''),[positionParent,setPositionParent]=useState('');
  const [selectedEmployee,setSelectedEmployee]=useState(''),[selectedPosition,setSelectedPosition]=useState('');
  const maps=useMemo(()=>remote.data?organizationMaps(remote.data):null,[remote.data]);
  const canManage=access.permissions.includes('organization.write');
  const canEditPosts=canManage && access.permissions.includes('employees.write');
  const canAssignProcesses=access.permissions.includes('employees.write') && access.permissions.includes('processes.write');
  const canCreateStaff=access.role==='super_admin';
  const departments=maps?[...maps.departments.values()].filter(d=>d.active!==false).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)||a.name.localeCompare(b.name,'es')):[];
  const allDepartments=maps?[...maps.departments.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)||a.name.localeCompare(b.name,'es')):[];
  const activePositions=maps?[...maps.positions.values()].filter(p=>p.active!==false):[];
  const availableEmployees=maps?[...maps.employees.values()].filter(e=>e.status==='active'):[];
  const roots=maps?[
    ...allDepartments.flatMap(d=>maps.roots.get(d.id)||[]),
    ...(maps.roots.get(null)||[]),
  ]:[];
  const submit=fn=>event=>{
    event.preventDefault();
    action.run(async()=>{
      await fn();
      setNotice('Cambios guardados correctamente.');
      remote.refresh();
    });
  };
  const createEmployee=submit(async()=>{
    await write('/employees',{...staff,status:'active'});
    setStaff(initialStaff);
    setNotice('Personal registrado.');
  });
  const createArea=submit(async()=>{
    await write('/areas',{department_id:Number(areaDepartment),name:areaName,description:'',active:true,sort_order:0});
    setAreaName('');setAreaDepartment('');
  });
  const createPosition=submit(async()=>{
    await write('/positions',{
      name:positionName,department_id:Number(positionDepartment),area_id:positionArea?Number(positionArea):null,
      parent_position_id:positionParent?Number(positionParent):null,active:true,sort_order:0,
    });
    setPositionName('');setPositionDepartment('');setPositionArea('');setPositionParent('');
  });
  const assignEmployee=submit(async()=>{
    await write('/employees/'+selectedEmployee+'/position',{position_id:Number(selectedPosition)},'PUT');
    setSelectedEmployee('');setSelectedPosition('');
  });
  const didSave=message=>{setSelected(null);setNotice(message||'Cambios guardados.');remote.refresh()};

  return <div className="organization-page icmsa-kpis-org">
    <header className="knowledge-hero">
      <span className="eyebrow">GOBIERNO DE PROCESOS</span>
      <h1>Organización</h1>
      <p>{canManage
        ? 'Administra puestos, personal y áreas funcionales. El organigrama indica quién reporta a quién; los procesos se asignan independientemente a las personas.'
        : 'Consulta el organigrama institucional y los procesos relacionados con cada puesto.'}</p>
    </header>

    {notice && <p className="org-notice" role="status">{notice}</p>}
    {action.error && <ErrorState message={action.error}/>}
    {remote.loading && <LoadingState label="Cargando organización…"/>}
    {remote.error && <ErrorState message={remote.error} onRetry={remote.refresh}/>}

    {maps && <>
      {(canManage||canCreateStaff||canEditPosts) && <section className="org-admin-grid" aria-label="Administración de estructura organizacional">
        {canCreateStaff && <form className="org-admin-card" onSubmit={createEmployee}>
          <h3>Agregar personal</h3>
          <label>Nombre<input required maxLength={255} value={staff.first_name} onChange={e=>setStaff(v=>({...v,first_name:e.target.value}))}/></label>
          <label>Apellidos<input required maxLength={255} value={staff.last_name} onChange={e=>setStaff(v=>({...v,last_name:e.target.value}))}/></label>
          <label>Número de empleado<input required maxLength={255} value={staff.employee_number} onChange={e=>setStaff(v=>({...v,employee_number:e.target.value}))}/></label>
          <p className="org-form-help">Para crear credenciales de acceso, utiliza Administración → Usuarios.</p>
          <button className="button primary" disabled={action.busy}>Crear empleado</button>
        </form>}

        {canManage && <form className="org-admin-card org-area-card" onSubmit={createArea}>
          <h3>Agregar área funcional</h3>
          <label>Departamento<select required value={areaDepartment} onChange={e=>setAreaDepartment(e.target.value)}>
            <option value="">Seleccionar departamento</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select></label>
          <label>Nombre del área<input required maxLength={255} value={areaName} onChange={e=>setAreaName(e.target.value)}/></label>
          <div className="org-existing-units"><small>Áreas existentes</small>
            <div>{[...maps.areas.values()].filter(a=>a.active!==false && (!areaDepartment||a.department_id===Number(areaDepartment))).length
              ? [...maps.areas.values()].filter(a=>a.active!==false && (!areaDepartment||a.department_id===Number(areaDepartment))).map(a=><span key={a.id}>{a.name}</span>)
              : <em>No hay áreas registradas.</em>}</div>
          </div>
          <button className="button primary" disabled={action.busy}>Crear área</button>
        </form>}

        {canManage && <form className="org-admin-card" onSubmit={createPosition}>
          <h3>Agregar puesto</h3>
          <label>Departamento<select required value={positionDepartment} onChange={e=>{setPositionDepartment(e.target.value);setPositionArea('');setPositionParent('')}}>
            <option value="">Seleccionar departamento</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select></label>
          <label>Área funcional (opcional)<select value={positionArea} onChange={e=>setPositionArea(e.target.value)}>
            <option value="">Directamente en el departamento</option>
            {[...maps.areas.values()].filter(a=>a.department_id===Number(positionDepartment)&&a.active!==false).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select></label>
          <label>Puesto<input required maxLength={255} value={positionName} onChange={e=>setPositionName(e.target.value)} placeholder="Responsable, Analista…"/></label>
          <label>Reporta a<select value={positionParent} onChange={e=>setPositionParent(e.target.value)}>
            <option value="">Nivel superior / raíz</option>
            {activePositions.filter(p=>maps.positionDepartment(p)===Number(positionDepartment)).map(p=><option key={p.id} value={p.id}>{p.name} · {maps.occupants.get(p.id)?displayName(maps.occupants.get(p.id)):'Vacante'}</option>)}
          </select></label>
          <button className="button primary" disabled={action.busy}>Crear puesto</button>
        </form>}

        {canEditPosts && <form className="org-admin-card" onSubmit={assignEmployee}>
          <h3>Asignar persona</h3>
          <label>Empleado<select required value={selectedEmployee} onChange={e=>setSelectedEmployee(e.target.value)}>
            <option value="">Seleccionar empleado</option>{availableEmployees.map(e=><option key={e.id} value={e.id}>{displayName(e)}</option>)}
          </select></label>
          <label>Puesto<select required value={selectedPosition} onChange={e=>setSelectedPosition(e.target.value)}>
            <option value="">Seleccionar puesto</option>{activePositions.map(p=>{
              const occupant=maps.occupants.get(p.id);
              const status=occupant?(String(occupant.id)===selectedEmployee?'Asignado a esta persona':'Ocupado por '+displayName(occupant)):'Vacante';
              return <option key={p.id} value={p.id}>{p.name} · {maps.departments.get(maps.positionDepartment(p))?.name||'Departamento'} · {status}</option>;
            })}
          </select></label>
          <p className="org-form-help">Una persona ocupa una plaza principal. La reasignación conserva el historial.</p>
          <button className="button primary" disabled={action.busy}>Asignar puesto</button>
        </form>}
      </section>}

      <section className="org-chart">
        <div className="org-chart-head">
          <div><span className="eyebrow">ESTRUCTURA ACTUAL</span><h2>Organigrama jerárquico</h2></div>
          <span>{availableEmployees.length} personas</span>
        </div>
        <p className="org-chart-help">Selecciona una tarjeta para editar el puesto o consultar procesos responsables y relacionados, como en KPIs Web.</p>
        <div className="org-tree" role="group" aria-label="Jerarquía de puestos">
          {roots.length ? roots.map(position=><PositionTree key={position.id} position={position} maps={maps}
            canEditProcesses={canAssignProcesses} onSelect={(p,showProcesses)=>setSelected({position:p,showProcesses})}/>) :
            <div className="empty-card">Todavía no existen puestos raíz. Crea tu primer puesto directamente en un departamento.</div>}
        </div>
      </section>

      {selected && <PositionModal key={selected.position.id} position={selected.position} maps={maps}
        canEdit={canEditPosts} canEditProcesses={canAssignProcesses}
        initialProcessEditor={selected.showProcesses} onClose={()=>setSelected(null)} onSaved={didSave}/>}
    </>}
  </div>;
}
