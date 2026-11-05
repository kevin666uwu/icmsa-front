import { useMemo, useState } from 'react';
import ResourcePage from '../ResourcePage.jsx';

const labels = {
  applicant:'Aspirante', active:'Activo', inactive:'Inactivo', graduated:'Egresado', withdrawn:'Baja',
  social_service:'Servicio social', professional_practice:'Prácticas profesionales',
  received:'Recibido', in_review:'En revisión', completed:'Concluido', cancelled:'Cancelado',
  open:'Abierta', in_progress:'En seguimiento', closed:'Cerrada',
  present:'Asistencia', late:'Retardo', absent:'Falta', justified:'Justificada',
  low:'Baja', normal:'Normal', high:'Alta', urgent:'Urgente',
};
const tabs = {
  students: [['students','Datos personales'],['student_incidents','Incidencias'],['student_attendance','Asistencia']],
  placements: [['service_placements','Expedientes y seguimiento']],
};
const columns = {
  students: ['student_number','first_name','last_name','second_last_name','email','phone','status'],
  student_incidents:['student_id','date','category','priority','status'],
  student_attendance:['student_id','date','status','notes'],
  service_placements:['student_id','kind','institution','required_hours','completed_hours','status'],
};
function operationSpec(name, original) {
  if (!original) return null;
  const fields = Object.fromEntries(Object.entries(original.fields).filter(([key]) => name !== 'students' || !['department_id','user_id'].includes(key)).map(([key,field]) => [key, {
    ...field, ...(field.choices ? {choice_labels:labels} : {}),
    ...(name==='students' && key==='area_id' ? {label:'Área responsable (opcional)'} : {}),
  }]));
  return {...original, fields};
}

export default function OperationsPage({ type, access }) {
  const [tab,setTab] = useState(tabs[type][0][0]);
  const specs = useMemo(() => Object.fromEntries(tabs[type].map(([name])=>[name,operationSpec(name,access.resources?.[name])])),[type,access]);
  const title = type === 'students' ? 'Alumnado' : 'Servicio social y prácticas profesionales';
  return <section className="operations-page">
    <div className="page-heading"><div><p className="eyebrow">Operación</p><h1>{title}</h1><p>{type==='students'
      ? 'Administra los datos del alumnado, atiende incidencias y registra su asistencia diaria.'
      : 'Da seguimiento a cada trámite: institución receptora, contacto, fechas, horas acreditadas y estado.'}</p></div></div>
    <div className="personnel-tabs" role="tablist" aria-label={title}>
      {tabs[type].map(([name,label])=><button type="button" key={name} id={'operation-tab-'+name} role="tab" aria-selected={tab===name} aria-controls="operation-panel" onClick={()=>setTab(name)}>{label}</button>)}
    </div>
    <div id="operation-panel" role="tabpanel" aria-labelledby={'operation-tab-'+tab}>
      {specs[tab] ? <ResourcePage embedded key={tab} name={tab} spec={specs[tab]} access={access} showDetails={false} resolveReferences visibleFields={columns[tab]}
        description={type==='placements' ? 'Crea el expediente del alumno y actualiza su avance. Las horas requeridas se capturan según el programa y trámite correspondiente.' : tab==='students' ? 'La matrícula identifica el expediente. Puedes actualizar nombre, apellidos, contacto, CURP, fecha de nacimiento, programa y estado.' : tab==='student_incidents' ? 'Registra lo ocurrido, su prioridad, el seguimiento y la resolución antes de cerrar la incidencia.' : 'Un registro por alumno y fecha. Puedes corregir el estado o agregar una justificación.'}/>
        : <p role="status">Este registro todavía no está disponible para tu cuenta. Comprueba que el sistema esté actualizado.</p>}
    </div>
  </section>;
}
