const studentNavigation = [
  { path: '/portal', label: 'Inicio', group: 'Mi aula', type: 'student', view: 'overview' },
  { path: '/portal/mis-clases', label: 'Mis clases', group: 'Mi aula', type: 'student', view: 'classes' },
  { path: '/portal/avance', label: 'Mi avance', group: 'Mi carrera', type: 'student', view: 'progress' },
  { path: '/portal/carrera', label: 'Mi carrera', group: 'Mi carrera', type: 'student', view: 'program' },
  { path: '/portal/profesores', label: 'Profesores', group: 'Mi carrera', type: 'student', view: 'teachers' },
  { path: '/portal/pagos', label: 'Pagos y saldo', group: 'Servicios', type: 'student', view: 'finance' },
];

export const navigation = [
  { path: '/portal', label: 'Inicio', group: 'Institución', type: 'dashboard' },
  { path: '/portal/personal', label: 'Personal', group: 'Organización', resource: 'employees' },
  { path: '/portal/organigrama', label: 'Organigrama', group: 'Organización', permission: 'organization.read', type: 'organization' },
  { path: '/portal/organizacion/departamentos', label: 'Departamentos', group: 'Organización', resource: 'departments' },
  { path: '/portal/organizacion/areas', label: 'Áreas', group: 'Organización', resource: 'areas' },
  { path: '/portal/organizacion/puestos', label: 'Puestos', group: 'Organización', resource: 'positions' },
  { path: '/portal/procesos', label: 'Procesos', group: 'Operación', resource: 'processes' },
  { path: '/portal/indicadores', label: 'Indicadores', group: 'Operación', resource: 'indicators' },
  { path: '/portal/asistencia', label: 'Asistencia', group: 'Operación', resource: 'attendance_records' },
  { path: '/portal/alumnos', label: 'Alumnos', group: 'Academia', resource: 'students' },
  { path: '/portal/academia/programas', label: 'Programas', group: 'Academia', resource: 'programs' },
  { path: '/portal/academia/periodos', label: 'Periodos', group: 'Academia', resource: 'academic_periods' },
  { path: '/portal/academia/materias', label: 'Materias', group: 'Academia', resource: 'subjects' },
  { path: '/portal/academia/grupos', label: 'Grupos', group: 'Academia', resource: 'groups' },
  { path: '/portal/servicios-escolares', label: 'Servicios Escolares', group: 'Servicios', resource: 'school_service_requests' },
  { path: '/portal/servicios-estudiantiles', label: 'Servicios Estudiantiles', group: 'Servicios', resource: 'student_service_cases' },
  { path: '/admin/usuarios', label: 'Usuarios', group: 'Administración', permission: 'users.read', type: 'users' },
  { path: '/admin/roles', label: 'Roles y permisos', group: 'Administración', permission: 'users.read', type: 'roles' },
  { path: '/admin/configuracion', label: 'Configuración', group: 'Administración', permission: 'users.read', type: 'settings' },
];

export function visibleNavigation(access) {
  if (access.role === 'student') return studentNavigation;
  return navigation.filter(item => item.resource ? Boolean(access.resources[item.resource]) : !item.permission || access.permissions.includes(item.permission));
}
