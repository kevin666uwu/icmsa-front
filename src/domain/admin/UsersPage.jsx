import { useCallback, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read, write, allRecords } from '../api.js';
const roles=[
  ['super_admin','Super administrador'],
  ['director','Director'],
  ['coordinator','Coordinador'],
  ['employee','Personal'],
  ['teacher','Docente'],
  ['student','Alumno'],
  ['viewer','Consulta'],
];
function UserEditor({ record, onClose, onSaved }) {
  const action=useAction(),[role,setRole]=useState(record?.role||'employee');
  return <Modal title={record?'Editar usuario':'Crear usuario'} onClose={onClose}><form className="entity-form" onSubmit={e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));data.active=data.active==='true';if(!data.password)delete data.password;action.run(async()=>{const saved=await write('/users'+(record?'/'+record.id:''),data,record?'PATCH':'POST');onSaved(saved);});}}>
    {!record&&<><label>Nombre<input name="name" required maxLength={120}/></label><label>Correo<input name="email" type="email" required/></label></>}
    <label>{record?'Nueva contraseña (opcional)':'Contraseña inicial'}<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required={!record}/></label>
    <label>Rol<select name="role" value={role} onChange={e=>setRole(e.target.value)}>{roles.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>Estado<select name="active" defaultValue={String(record?.active??true)}><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
    {role==='student'&&<p className="form-hint">Al guardar, completa también su expediente académico para habilitar el portal del alumno.</p>}
    {action.error&&<ErrorState message={action.error}/>}<button className="button primary" disabled={action.busy}>{action.busy?'Guardando…':'Guardar usuario'}</button>
  </form></Modal>;
}

function StudentProfileEditor({ user, onClose, onSaved }) {
  const load=useCallback(async signal=>{
    const [profile,programs]=await Promise.all([
      read('/users/'+user.id+'/student-profile',signal),
      allRecords('/academic/programs',signal),
    ]);
    return {profile,programs};
  },[user.id]);
  const remote=useRemote(load);
  if(remote.loading)return <Modal title={'Expediente · '+user.name} onClose={onClose}><LoadingState/></Modal>;
  if(remote.error)return <Modal title={'Expediente · '+user.name} onClose={onClose}><ErrorState message={remote.error} onRetry={remote.refresh}/></Modal>;
  return <StudentProfileForm user={user} data={remote.data} onClose={onClose} onSaved={onSaved}/>;
}

function StudentProfileForm({ user, data, onClose, onSaved }) {
  const current=data.profile?.student||{};
  const names=(user.name||'').trim().split(/\s+/);
  const action=useAction();
  return <Modal title={'Expediente de alumno · '+user.name} onClose={onClose}>
    <p className="modal-intro">Vincula esta cuenta con su expediente académico. La matrícula será la llave del portal del alumno.</p>
    <form className="entity-form" onSubmit={e=>{e.preventDefault();const raw=Object.fromEntries(new FormData(e.currentTarget));const payload={
      student_number:raw.student_number.trim(),
      first_name:raw.first_name.trim(),last_name:raw.last_name.trim(),second_last_name:raw.second_last_name.trim()||null,
      email:raw.email.trim()||user.email,phone:raw.phone.trim()||null,curp:raw.curp.trim()||null,birth_date:raw.birth_date||null,
      status:raw.status,program_id:raw.program_id?Number(raw.program_id):null,
    };action.run(async()=>{await write('/users/'+user.id+'/student-profile',payload,'PUT');onSaved();});}}>
      <label>Matrícula<input name="student_number" defaultValue={current.student_number||''} required/></label>
      <label>Correo institucional<input name="email" type="email" defaultValue={current.email||user.email||''}/></label>
      <label>Nombre<input name="first_name" defaultValue={current.first_name||names[0]||''} required/></label>
      <label>Primer apellido<input name="last_name" defaultValue={current.last_name||names.slice(1,2).join(' ')||'Alumno'} required/></label>
      <label>Segundo apellido<input name="second_last_name" defaultValue={current.second_last_name||''}/></label>
      <label>Programa<select name="program_id" defaultValue={current.program_id||''}><option value="">Por asignar</option>{data.programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Teléfono<input name="phone" defaultValue={current.phone||''}/></label>
      <label>CURP<input name="curp" maxLength={18} defaultValue={current.curp||''}/></label>
      <label>Fecha de nacimiento<input name="birth_date" type="date" defaultValue={current.birth_date||''}/></label>
      <label>Estado<select name="status" defaultValue={current.status||'active'}><option value="applicant">Aspirante</option><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="graduated">Egresado</option><option value="withdrawn">Baja</option></select></label>
      {action.error&&<ErrorState message={action.error}/>}<div className="form-actions"><button className="button primary" disabled={action.busy}>{action.busy?'Guardando…':'Guardar y habilitar portal'}</button></div>
    </form>
  </Modal>;
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
  const [offset,setOffset]=useState(0),[edit,setEdit]=useState(undefined),[scope,setScope]=useState(null),[studentProfile,setStudentProfile]=useState(null),[notice,setNotice]=useState('');
  const loader=useCallback(signal=>read('/users?limit=25&offset='+offset,signal),[offset]),remote=useRemote(loader);
  return <section><div className="page-heading"><div><h1>Usuarios</h1><p>Las cuentas de acceso y los empleados son registros independientes.</p></div><button className="button primary" onClick={()=>setEdit(null)}>Crear usuario</button></div>
    {notice&&<p role="status">{notice}</p>}{remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:<div className="table-scroll"><table className="responsive-table"><caption>Cuentas institucionales</caption><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{remote.data.map(row=><tr key={row.id}><td data-label="Nombre">{row.name}</td><td data-label="Correo">{row.email}</td><td data-label="Rol">{row.role}</td><td data-label="Estado">{row.active?'Activo':'Inactivo'}</td><td data-label="Acciones">{row.id!==user.id&&<><button onClick={()=>setEdit(row)}>Editar</button>{row.role==='student'?<button onClick={()=>setStudentProfile(row)}>Expediente alumno</button>:<button onClick={()=>setScope(row)}>Alcances</button>}</>}</td></tr>)}</tbody></table></div>}
    <div className="pagination"><button disabled={!offset} onClick={()=>setOffset(v=>Math.max(0,v-25))}>Anterior</button><button disabled={!remote.data||remote.data.length<25} onClick={()=>setOffset(v=>v+25)}>Siguiente</button></div>
    {edit!==undefined&&<UserEditor record={edit} onClose={()=>setEdit(undefined)} onSaved={saved=>{setEdit(undefined);setNotice('Usuario guardado.');remote.refresh();if(saved?.role==='student')setStudentProfile(saved);}}/>}
    {scope&&<ScopeEditor user={scope} onClose={()=>setScope(null)}/> }
    {studentProfile&&<StudentProfileEditor user={studentProfile} onClose={()=>setStudentProfile(null)} onSaved={()=>{setStudentProfile(null);setNotice('Expediente de alumno vinculado.');remote.refresh();}}/>}
  </section>;
}

