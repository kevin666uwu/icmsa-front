import { useCallback, useState } from 'react';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { read, write } from '../api.js';
import { operationModules } from '../operations/modules.js';
import { navigate } from '../../app/router/navigation.js';

function ModuleEditor({processId,data,onSaved,onCancel}) {
  const [keys,setKeys]=useState(data.module_keys || []);
  const action=useAction();
  return <form onSubmit={event=>{event.preventDefault();action.run(async()=>{await write('/processes/'+processId+'/modules',{module_keys:keys},'PUT');onSaved();});}}>
    <fieldset className="process-module-options"><legend>Módulos que utiliza este proceso</legend>
      {(data.available || []).map(module=><label key={module.key}><input type="checkbox" checked={keys.includes(module.key)} disabled={action.busy} onChange={event=>setKeys(current=>event.target.checked ? [...current,module.key] : current.filter(key=>key!==module.key))}/><span>{module.name}</span></label>)}
    </fieldset>
    {action.error && <ErrorState message={action.error}/>}
    <div className="form-actions"><button className="button primary" disabled={action.busy}>{action.busy?'Guardando…':'Guardar vínculos'}</button><button type="button" className="button secondary" disabled={action.busy} onClick={onCancel}>Cancelar</button></div>
  </form>;
}

export default function ProcessModules({processId,canManage}) {
  const loader=useCallback(signal=>read('/processes/'+processId+'/modules',signal),[processId]);
  const remote=useRemote(loader);
  const [editing,setEditing]=useState(false),[notice,setNotice]=useState('');
  const linked=(remote.data?.available || []).filter(module=>remote.data.module_keys?.includes(module.key));
  return <section className="process-module-section">
    <h3>Módulos vinculados</h3><p className="muted">Relaciona este proceso con las herramientas que utiliza para operar.</p>
    {notice && <p role="status" className="notice">{notice}</p>}
    {remote.loading ? <LoadingState/> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh}/> : editing ?
      <ModuleEditor processId={processId} data={remote.data} onCancel={()=>setEditing(false)} onSaved={()=>{setEditing(false);setNotice('Vínculos actualizados.');remote.refresh();}}/> : <>
        {linked.length ? <ul className="process-module-links">{linked.map(module=>{
          const item=operationModules.find(candidate=>candidate.key===module.key);
          return item && <li key={module.key}><a href={item.path} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(item.path);}}>{module.name}</a></li>;
        })}</ul> : <p>No hay módulos vinculados disponibles para tu cuenta.</p>}
        {canManage && (remote.data?.available || []).length>0 && <button type="button" className="button secondary" onClick={()=>setEditing(true)}>Vincular módulos</button>}
      </>}
  </section>;
}
