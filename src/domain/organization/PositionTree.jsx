import { displayName } from '../api.js';
export default function PositionTree({ position, maps, onSelect, ancestors = [] }) {
  if (ancestors.includes(position.id)) return <li role="alert">Jerarquía inválida. Solicita revisión.</li>;
  const employee = maps.occupants.get(position.id), area = maps.areas.get(position.area_id), department = maps.departments.get(area?.department_id);
  const overview = maps.overview[String(employee?.id)];
  return <li className="position-node"><button className="position-card" onClick={() => onSelect(position)}>
    <span className={employee ? 'occupant' : 'vacant'}>{employee ? displayName(employee) : 'VACANTE'}</span><strong>{position.name}</strong>
    <span>{area?.name} · {department?.name}</span><small>{overview?.responsible.length || 0} responsables · {overview?.related.length || 0} relacionados</small>
  </button>{maps.children.get(position.id)?.length > 0 && <ul>{maps.children.get(position.id).map(child => <PositionTree key={child.id} position={child} maps={maps} onSelect={onSelect} ancestors={[...ancestors, position.id]} />)}</ul>}</li>;
}
