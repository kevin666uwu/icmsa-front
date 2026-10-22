export function organizationMaps(data) {
  const positions = new Map(data.positions.map(p => [p.id, p]));
  const employees = new Map(data.employees.map(e => [e.id, e]));
  const areas = new Map(data.areas.map(a => [a.id, a]));
  const departments = new Map(data.departments.map(d => [d.id, d]));
  const occupants = new Map(data.memberships.filter(m => m.active && m.is_primary).map(m => [m.position_id, employees.get(m.employee_id)]));
  const children = new Map();
  for (const position of data.positions) {
    const parent = positions.has(position.parent_position_id) ? position.parent_position_id : null;
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(position);
  }
  return { positions, employees, areas, departments, occupants, children, overview: data.process_overview };
}
