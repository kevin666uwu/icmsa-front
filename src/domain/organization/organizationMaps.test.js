import { describe, expect, it } from 'vitest';
import { organizationMaps } from './organizationMaps.js';

describe('organigrama departamental', () => {
  const fixture = {
    departments: [
      { id: 1, name: 'Servicios Escolares', active: true, sort_order: 0 },
      { id: 2, name: 'Academia', active: true, sort_order: 1 },
    ],
    areas: [{ id: 5, name: 'Control Escolar', department_id: 1 }],
    positions: [
      { id: 10, name: 'Responsable del departamento', department_id: 1, area_id: null, parent_position_id: null },
      { id: 11, name: 'Analista', department_id: 1, area_id: 5, parent_position_id: 10 },
      { id: 12, name: 'Docente', department_id: 2, area_id: null, parent_position_id: null },
    ],
    employees: [
      { id: 3, first_name: 'Fernanda', last_name: 'Demo', status: 'active' },
    ],
    memberships: [{ employee_id: 3, position_id: 10, active: true, is_primary: true }],
    processes: [
      { id: 20, department_id: 1, area_id: null, name: 'Inscripciones', status: 'active' },
      { id: 21, department_id: 1, area_id: 5, name: 'Constancias', status: 'active' },
    ],
    process_overview: { '3': { responsible: [{ id: 20 }, { id: 21 }], related: [] } },
  };

  it('agrupa la jefatura directamente en el departamento, no en el área', () => {
    const result = organizationMaps(fixture);
    expect(result.roots.get(1).map(p => p.id)).toEqual([10]);
    expect(result.children.get(10).map(p => p.id)).toEqual([11]);
    expect(result.roots.get(2).map(p => p.id)).toEqual([12]);
    expect(result.positionDepartment(result.positions.get(10))).toBe(1);
    expect(result.occupants.get(10).first_name).toBe('Fernanda');
    expect(result.overview['3'].responsible).toHaveLength(2);
  });

  it('tolera estructuras previas donde el puesto solo tenía area_id', () => {
    const legacy = { ...fixture, positions: [
      { id: 50, name: 'Antiguo', area_id: 5, parent_position_id: null },
    ], memberships: [] };
    const result = organizationMaps(legacy);
    expect(result.roots.get(1)[0].id).toBe(50);
  });

  it('respeta líneas jerárquicas entre departamentos, como KPIs Web', () => {
    const altered = { ...fixture, positions: [
      ...fixture.positions.map(p => p.id === 12 ? { ...p, parent_position_id: 10 } : p),
    ] };
    const result = organizationMaps(altered);
    expect(result.roots.get(2) || []).toEqual([]);
    expect(result.children.get(10).map(p => p.id)).toEqual([11,12]);
  });
});
