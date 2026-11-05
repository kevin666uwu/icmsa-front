import { useCallback } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { navigate } from '../../app/router/navigation.js';
import { read } from '../api.js';
import { allowedModules } from './modules.js';

export default function ModulesPage({ access }) {
  const loader=useCallback(signal=>read('/operation-modules',signal),[]);
  const remote=useRemote(loader);
  return <section className="operations-page">
    <div className="page-heading"><div><p className="eyebrow">Operación</p><h1>Módulos</h1><p>Selecciona el módulo en el que quieres trabajar. Cada tarjeta muestra los procesos que lo utilizan.</p></div></div>
    {remote.loading && <LoadingState label="Cargando vínculos con procesos…"/>}
    {remote.error && <ErrorState message={remote.error} onRetry={remote.refresh}/>}
    <div className="operation-module-grid">{allowedModules(access).map(module=>{
      const links=remote.data?.items.find(item=>item.key===module.key)?.processes || [];
      return <article className="operation-module-card" key={module.key}>
        <span className="operation-module-mark" aria-hidden="true">{module.mark}</span>
        <h2>{module.label}</h2><p>{module.description}</p>
        {!remote.loading && !remote.error && <div className="operation-module-links"><h3>Procesos vinculados</h3>{links.length ? <ul>{links.map(process=><li key={process.id}>{process.name}</li>)}</ul> : <p>Aún no tiene procesos vinculados.</p>}</div>}
        <a className="button primary" href={module.path} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(module.path);}}>Abrir {module.label}</a>
      </article>;
    })}</div>
  </section>;
}
