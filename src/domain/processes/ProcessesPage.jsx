import { useMemo } from 'react';
import ResourcePage from '../ResourcePage.jsx';

const columns=['name','area_id','status'];
const labels={draft:'Borrador',active:'Activo',inactive:'Inactivo',review:'En revisión'};
export default function ProcessesPage({access}) {
  const original=access.resources?.processes;
  const spec=useMemo(()=>original && {...original,fields:Object.fromEntries(Object.entries(original.fields).filter(([key])=>key!=='department_id').map(([key,field])=>[key,{
    ...field,...(key==='area_id'?{label:'Área responsable (opcional)'}:{}),...(key==='status'?{choice_labels:labels}:{}),
  }]))},[original]);
  return <section className="operations-page">
    {spec ? <ResourcePage name="processes" spec={spec} access={access} resolveReferences visibleFields={columns} description="Documenta cada proceso, sus responsables y pasos. En Ver detalle puedes vincular los módulos que utiliza."/>
      : <p role="status">El registro de procesos todavía no está disponible para tu cuenta.</p>}
  </section>;
}
