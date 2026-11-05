import { describe, expect, it } from 'vitest';
import { navigation, hiddenNavigation, hiddenRoute, studentNavigation, visibleNavigation } from './navigation.js';

describe('reinicio de navegación administrativa ICMSA', () => {
  it('agrupa Organigrama y Personal en Administración respetando permisos', () => {
    expect(navigation).toHaveLength(4);
    expect(navigation[1]).toMatchObject({
      path: '/portal/organigrama',
      label: 'Organigrama',
      group: 'Administración',
      permission: 'organization.read',
      type: 'organization',
    });
    const access = {
      role: 'super_admin',
      permissions: ['organization.read', 'organization.write', 'employees.read', 'users.read'],
      resources: { processes: { path: '/processes' }, students: { path: '/students' } },
    };
    expect(visibleNavigation(access).map(item=>item.label)).toEqual(['Personal', 'Organigrama']);
    expect(visibleNavigation({ ...access, permissions: [] })).toEqual([]);
  });

  it('muestra Procesos antes de Módulos y deja los módulos individuales fuera del menú', () => {
    const items = visibleNavigation({role:'super_admin',permissions:['employees.read','organization.read','processes.read','admissions.read','student_services.read','students.read','finance.read'],resources:{}});
    expect(items.map(item=>item.label)).toEqual(['Personal','Organigrama','Procesos','Módulos']);
    expect(items.slice(2).every(item=>item.group==='Operación')).toBe(true);
    expect(visibleNavigation({role:'employee',permissions:['students.read'],resources:{}}).map(item=>item.label)).toEqual(['Módulos']);
    expect(hiddenRoute('/portal/operacion/alumnado',{permissions:['students.read']})?.type).toBe('students');
    expect(hiddenRoute('/portal/operacion/finanzas',{permissions:['students.read']})).toBeNull();
  });

  it('conserva las rutas restantes sin mostrarlas en el menú', () => {
    expect(hiddenNavigation.some(item=>item.path==='/portal/procesos')).toBe(true);
    expect(hiddenNavigation.some(item=>item.path==='/admin/usuarios')).toBe(true);
    expect(hiddenNavigation.some(item=>item.path==='/portal/alumnos')).toBe(true);
    const access = {
      role: 'super_admin',
      permissions: ['users.read', 'organization.read'],
      resources: { processes: { path: '/processes' } },
    };
    expect(hiddenRoute('/portal/procesos', access)?.resource).toBe('processes');
    expect(hiddenRoute('/admin/usuarios', access)?.type).toBe('users');
    expect(hiddenRoute('/portal/alumnos', access)).toBeNull();
    expect(hiddenRoute('/admin/documentos', access)).toBeNull();
    expect(hiddenRoute('/portal/organigrama', access)).toBeNull();
  });

  it('no altera las opciones del portal estudiantil', () => {
    expect(studentNavigation.some(item=>item.path==='/portal')).toBe(true);
    expect(studentNavigation.some(item=>item.path==='/portal/tramites')).toBe(true);
    expect(studentNavigation.some(item=>item.path==='/portal/documentos')).toBe(true);
    expect(visibleNavigation({ role: 'student' })).toEqual(studentNavigation);
  });
});
