import { describe, expect, it } from 'vitest';
import { navigation, studentNavigation, visibleNavigation } from './navigation.js';

describe('navegación institucional simplificada', () => {
  it('muestra solamente Organigrama bajo Organización', () => {
    const organization = navigation.filter(item => item.group === 'Organización');
    expect(organization.map(item => item.label)).toEqual(['Organigrama']);
    expect(organization[0].path).toBe('/portal/organigrama');
  });

  it('mantiene Procesos como módulo independiente', () => {
    const processes = navigation.find(item => item.path === '/portal/procesos');
    expect(processes).toMatchObject({ label: 'Procesos', group: 'Operación', resource: 'processes' });
  });

  it('no muestra Servicios Escolares ni Servicios Estudiantiles en el menú administrativo', () => {
    expect(navigation.some(item => item.path === '/portal/servicios-escolares')).toBe(false);
    expect(navigation.some(item => item.path === '/portal/servicios-estudiantiles')).toBe(false);
    expect(navigation.some(item => item.group === 'Servicios')).toBe(false);
  });

  it('conserva el portal del alumno y las capacidades de la institución', () => {
    expect(studentNavigation.some(item => item.path === '/portal/tramites')).toBe(true);
    expect(studentNavigation.some(item => item.path === '/portal/documentos')).toBe(true);
    expect(navigation.some(item => item.resource === 'students')).toBe(true);
    const access = {
      role: 'super_admin',
      permissions: ['organization.read'],
      resources: Object.fromEntries(navigation.filter(x => x.resource).map(x => [x.resource, {path:'/' + x.resource}]))
    };
    const visible = visibleNavigation(access);
    expect(visible.filter(item => item.group === 'Organización')).toHaveLength(1);
    expect(visible.find(item => item.path === '/portal/procesos')).toBeDefined();
  });
});
