export function organizationMaps(data) {
  const positions = new Map(data.positions.map(p => [p.id, p]));
  const employees = new Map(data.employees.map(e => [e.id, e]));
  const areas = new Map(data.areas.map(a => [a.id, a]));
  const departments = new Map(data.departments.map(d => [d.id, d]));
  const occupants = new Map(data.memberships.filter(m => m.active && m.is_primary)
    .map(m => [m.position_id, employees.get(m.employee_id)]));
  const children = new Map();
  const roots = new Map();
  const positionDepartment = position => position.department_id ?? areas.get(position.area_id)?.department_id ?? null;
  for (const position of data.positions) {
    const parent = positions.get(position.parent_position_id);
    // Reporting lines are independent from functional areas or departments,
    // as in KPIs Web. A director can supervise leaders in several departments.
    if (!parent) {
      const department = positionDepartment(position);
      if (!roots.has(department)) roots.set(department, []);
      roots.get(department).push(position);
    } else {
      if (!children.has(parent.id)) children.set(parent.id, []);
      children.get(parent.id).push(position);
    }
  }
  const byOrder = (a,b) => (a.sort_order ?? 0)-(b.sort_order ?? 0) || a.name.localeCompare(b.name, 'es');
  for (const list of [...roots.values(), ...children.values()]) list.sort(byOrder);
  const overview = data.process_overview || {};
  const processes = data.processes || [];
  return {positions, employees, areas, departments, occupants, roots, children, overview, processes, positionDepartment};
}
