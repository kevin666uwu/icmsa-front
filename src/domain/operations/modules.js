export const operationModules = [
  {key:'admissions',path:'/portal/operacion/admision',label:'Admisión',permission:'admissions.read',type:'admissions',mark:'AD',description:'Revisa solicitudes pendientes y da seguimiento a cada aspirante.'},
  {key:'placements',path:'/portal/operacion/servicio-social',label:'Servicio social y prácticas profesionales',permission:'student_services.read',type:'placements',mark:'SP',description:'Gestiona instituciones receptoras, fechas, horas y avance de los trámites.'},
  {key:'students',path:'/portal/operacion/alumnado',label:'Alumnado',permission:'students.read',type:'students',mark:'AL',description:'Actualiza expedientes, atiende incidencias y registra asistencia.'},
  {key:'finance',path:'/portal/operacion/finanzas',label:'Finanzas',permission:'finance.read',type:'finance',mark:'FI',description:'Controla cargos, abonos, saldos pendientes y gastos operativos.'},
];

export function allowedModules(access) {
  return operationModules.filter(module=>access.permissions?.includes(module.permission));
}
