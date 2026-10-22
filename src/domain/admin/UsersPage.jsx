import { useCallback, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read, write, allRecords } from '../api.js';
const roles=['super_admin','director','coordinator','employee','viewer'];
function UserEditor({ record, onClose, onSaved }) {
  const action=useAction();
  return <Modal title={record?'Editar usuario':'Crear usuario'} onClose={onClose}><form className="entity-form" onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));data.active=data.active==='true';if(!data.password)delete data.password;action.run(async()=>{await write('/users'+(record?'/'+record.id:''),data,record?'PATCH':'POST');onSaved();});}}>
    {!record&&<><label>Nombre<input name="name" required maxLength={120}/></label><label>Correo<input name="email" type="email" required/></label></>}
    <label>{record?'Nueva contraseña (opcional)':'Contraseña inicial'}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required={!record}/></label>
    <label>Rol<select name="role" defaultValue={record?.role||'employee'}>{roles.map(role=><option key={role}>{role}</option>)}</select></label>
    <label>Estado<select name="active" defaultValue={String(record?.active??true)}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
    {action.error&&<ErrorState message={action.error}/>}<button className="button primary" disabled={action.busy}>{action.busy?'Guardando…':'Guardar usuario'}</button>
  </form></Modal>;
}
function ScopeEditor({ user, onClose }) {
  const load=useCallback(async signal=>{const [scopes,departments,areas]=await Promise.all([read('/users/'+user.id+'/scopes',signal),allRecords('/departments',signal),allRecords('/areas',signal)]);return {scopes,departments,areas};},[user.id]);
  const remote=useRemote(load);
  return <Modal title={'Alcance · '+user.name} onClose={onClose}>{remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:<ScopeForm data={remote.data} user={user} onSaved={onClose}/>}</Modal>;
}
function ScopeForm({ data, user, onSaved }) {
  const [items,setItems]=useState(data.scopes.map(({department_id,area_id})=>({department_id,area_id})));
  const [department,setDepartment]=useState(''),[area,setArea]=useState('');
  const action=useAction();
  return <div><p>Sin alcances, los roles distintos de super_admin no ven registros institucionales. Guardar revoca las sesiones del usuario.</p>
    <ul>{items.map((s,i)=><li key={i}>{data.departments.find(d=>d.id===s.department_id)?.name} · {s.area_id?data.areas.find(a=>a.id===s.area_id)?.name:'Todo el departamento'} <button onClick={()=>setItems(v=>v.filter((_,j)=>j!==i))}>Quitar</button></li>)}</ul>
    <form className="entity-form" onSubmit={e=>{e.preventDefault();setItems(v=>[...v,{department_id:Number(department),area_id:area?Number(area):null}]);}}>
      <label>Departamento<select required value={department} onChange={e=>{setDepartment(e.target.value);setArea('');}}><option value="">Seleccionar…</option>{data.departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Área<select value={area} onChange={e=>setArea(e.target.value)}><option value="">Todo el departamento</option>{data.areas.filter(a=>a.department_id===Number(department)).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><button>Agregar alcance</button>
    </form>{action.error&&<ErrorState message={action.error}/>}<button className="button primary" disabled={action.busy} onClick={()=>action.run(async()=>{await write('/users/'+user.id+'/scopes',items,'PUT');onSaved();})}>Guardar alcances</button>
  </div>;
}
export default function UsersPage({ user }) {
  const [offset,setOffset]=useState(0),[edit,setEdit]=useState(undefined),[scope,setScope]=useState(null),[notice,setNotice]=useState('');
  const loader=useCallback(signal=>read('/users?limit=25&offset='+offset,signal),[offset]),remote=useRemote(loader);
  return <section><div className="page-heading"><div><h1>Usuarios</h1><p>Las cuentas de acceso y los empleados son registros independientes.</p></div><button className="button primary" onClick={()=>setEdit(null)}>Crear usuario</button></div>
    {notice&&<p role="status">{notice}</p>}{remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:<div className="table-scroll"><table><caption>Cuentas institucionales</caption><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{remote.data.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.email}</td><td>{row.role}</td><td>{row.active?'Activo':'Inactivo'}</td><td>{row.id!==user.id&&<><button onClick={()=>setEdit(row)}>Editar</button><button onClick={()=>setScope(row)}>Alcances</button></>}</td></tr>)}</tbody></table></div>}
    <div className="pagination"><button disabled={!offset} onClick={()=>setOffset(v=>Math.max(0,v-25))}>Anterior</button><button disabled={!remote.data||remote.data.length<25} onClick={()=>setOffset(v=>v+25)}>Siguiente</button></div>
    {edit!==undefined&&<UserEditor record={edit} onClose={()=>setEdit(undefined)} onSaved={()=>{setEdit(undefined);setNotice('Usuario guardado.');remote.refresh();}}/>}
    {scope&&<ScopeEditor user={scope} onClose={()=>setScope(null)}/>}
  </section>;
}
