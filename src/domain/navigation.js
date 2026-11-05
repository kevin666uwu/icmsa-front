export const studentNavigation = [
  { path: '/portal', label: 'Inicio', group: 'Mi aula', type: 'student', view: 'overview' },
  { path: '/portal/biblioteca', label: 'Biblioteca digital', group: 'Mi carrera', type: 'student', view: 'library' },
  { path: '/portal/mis-clases', label: 'Mis clases', group: 'Mi aula', type: 'student', view: 'classes' },
  { path: '/portal/avance', label: 'Mi avance', group: 'Mi carrera', type: 'student', view: 'progress' },
  { path: '/portal/carrera', label: 'Mi carrera', group: 'Mi carrera', type: 'student', view: 'program' },
  { path: '/portal/profesores', label: 'Profesores', group: 'Mi carrera', type: 'student', view: 'teachers' },
  { path: '/portal/pagos', label: 'Pagos y saldo', group: 'Servicios', type: 'student', view: 'finance' },
  { path: '/portal/tramites', label: 'Trámites', group: 'Servicios', type: 'student', view: 'services' },
  { path: '/portal/documentos', label: 'Documentos', group: 'Servicios', type: 'student', view: 'documents' },
];

// Administración concentra la gestión del personal y su estructura.
export const navigation = [
  { path: '/portal/personal', label: 'Personal', group: 'Administración', permission: 'employees.read', type: 'personnel' },
  { path: '/portal/organigrama', label: 'Organigrama', group: 'Administración', permission: 'organization.read', type: 'organization' },
];

export const hiddenNavigation = [
  { path: '/admin/documentos', label: 'Revisión documental', group: 'Administración', permission: 'documents.read', type: 'documents' },
  { path: '/admin/admision', label: 'Solicitudes de admisión', group: 'Admisión', permission: 'admissions.read', type: 'admissions' },
  { path: '/admin/biblioteca', label: 'Biblioteca digital', group: 'Administración', resource: 'library_resources' },
  { path: '/portal', label: 'Inicio', group: 'Institución', type: 'dashboard' },
  { path: '/portal/procesos', label: 'Procesos', group: 'Operación', resource: 'processes' },
  { path: '/portal/indicadores', label: 'Indicadores', group: 'Operación', resource: 'indicators' },
  { path: '/portal/asistencia', label: 'Asistencia', group: 'Operación', resource: 'attendance_records' },
  { path: '/portal/alumnos', label: 'Alumnos', group: 'Academia', resource: 'students' },
  { path: '/portal/academia/programas', label: 'Programas', group: 'Academia', resource: 'programs' },
  { path: '/portal/academia/periodos', label: 'Periodos', group: 'Academia', resource: 'academic_periods' },
  { path: '/portal/academia/materias', label: 'Materias', group: 'Academia', resource: 'subjects' },
  { path: '/portal/academia/grupos', label: 'Grupos', group: 'Academia', resource: 'groups' },
  { path: '/admin/usuarios', label: 'Usuarios', group: 'Administración', permission: 'users.read', type: 'users' },
  { path: '/admin/roles', label: 'Roles y permisos', group: 'Administración', permission: 'users.read', type: 'roles' },
  { path: '/admin/configuracion', label: 'Configuración', group: 'Administración', permission: 'users.read', type: 'settings' },
];

export function visibleNavigation(access) {
  if (access.role === 'student') return studentNavigation;
  return navigation.filter(item => item.resource ? Boolean(access.resources?.[item.resource]) : !item.permission || access.permissions?.includes(item.permission));
}


export function hiddenRoute(path, access) {
  const item = hiddenNavigation.find(entry => entry.path === path);
  if (!item) return null;
  if (item.resource) return access.resources?.[item.resource] ? item : null;
  return !item.permission || access.permissions?.includes(item.permission) ? item : null;
}
