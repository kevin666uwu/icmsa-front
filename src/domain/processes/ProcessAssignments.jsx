import { useCallback, useState } from 'react';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read, write, allRecords, displayName } from '../api.js';
function Editor({ data, processId, onSaved }) {
  const [items, setItems] = useState(data.items.map(({employee_id,position_id,area_id,permission,is_responsible}) => ({employee_id,position_id,area_id,permission,is_responsible})));
  const [target, setTarget] = useState('employee_id'), [identity, setIdentity] = useState(''), [permission, setPermission] = useState('VIEW'), [responsible,setResponsible]=useState(false);
  const action=useAction(), names={employee_id:'Empleado',position_id:'Puesto',area_id:'Área'};
  return <div><ul>{items.map((item,index) => { const type=Object.keys(names).find(k=>item[k]); const row=data[type].find(r=>r.id===item[type]); return <li key={index}>{names[type]}: {row ? displayName(row) : '#' + item[type]} · {item.permission}{item.is_responsible ? ' · Responsable' : ''} <button onClick={()=>setItems(v=>v.filter((_,i)=>i!==index))}>Quitar</button></li>; })}</ul>
    <form className="entity-form" onSubmit={e=>{e.preventDefault();setItems(v=>[...v,{employee_id:null,position_id:null,area_id:null,[target]:Number(identity),permission:responsible?'MANAGE':permission,is_responsible:responsible}]);setIdentity('');}}>
      <label>Asignar a<select value={target} onChange={e=>{setTarget(e.target.value);setIdentity('');}}>{Object.entries(names).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
      <label>Seleccionar responsable o participante<select required value={identity} onChange={e=>setIdentity(e.target.value)}><option value="">Seleccionar…</option>{data[target].map(row=><option key={row.id} value={row.id}>{displayName(row)} · #{row.id}</option>)}</select></label>
      <label>Permiso<select value={permission} onChange={e=>setPermission(e.target.value)}>{['VIEW','EDIT','MANAGE'].map(p=><option key={p}>{p}</option>)}</select></label>
      <label><input type="checkbox" checked={responsible} onChange={e=>setResponsible(e.target.checked)} />Responsable principal (MANAGE)</label><button>Agregar asignación</button>
    </form>{action.error&&<ErrorState message={action.error}/>}<button className="button primary" disabled={action.busy} onClick={()=>action.run(async()=>{await write('/processes/'+processId+'/assignments',{items},'PUT');onSaved();})}>Guardar asignaciones</button>
  </div>;
}
export default function ProcessAssignments({ processId, access }) {
  const loader=useCallback(async signal=>{
    const [items,employees,positions,areas]=await Promise.all([read('/processes/'+processId+'/assignments',signal),...['employees','positions','areas'].map(k=>access.resources[k]?allRecords(access.resources[k].path,signal):Promise.resolve([]))]);
    return {items,employee_id:employees,position_id:positions,area_id:areas};
  },[processId,access]);
  const remote=useRemote(loader);
  return <section><h3>Asignaciones por empleado, puesto y área</h3>{remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:<Editor data={remote.data} processId={processId} onSaved={remote.refresh}/>}</section>;
}
