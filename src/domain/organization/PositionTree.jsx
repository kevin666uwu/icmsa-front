import { displayName } from '../api.js';

/** Estructura visual y conectores del organigrama de KPIs Web, adaptados a ICMSA. */
export default function PositionTree({ position, maps, onSelect, canEditProcesses=false, ancestors=[] }) {
  if (ancestors.includes(position.id)) return <div className="org-tree-node" role="alert">Jerarquía inválida. Solicita revisión.</div>;
  const occupant=maps.occupants.get(position.id);
  const overview=maps.overview[String(occupant?.id)] || { responsible:[], related:[] };
  const area=maps.areas.get(position.area_id);
  const department=maps.departments.get(maps.positionDepartment(position));
  const children=maps.children.get(position.id) || [];
  return <div className="org-tree-node">
    <div className="org-node-card">
      <button type="button" className="org-node-main" onClick={()=>onSelect(position,false)} aria-label={'Ver puesto '+position.name}>
        <strong>{occupant ? displayName(occupant) : 'Vacante'}</strong>
        <span>{position.name}</span>
        <small>{area?.name || department?.name || 'Puesto departamental'}</small>
        <div className="org-node-counts">
          <span><b>{overview.responsible?.length || 0}</b> Procesos del usuario</span>
          <span><b>{overview.related?.length || 0}</b> Procesos relacionados</span>
        </div>
      </button>
      {canEditProcesses && occupant && <button type="button" className="org-node-edit-processes" onClick={()=>onSelect(position,true)}>Editar procesos</button>}
    </div>
    {children.length>0 && <div className="org-tree-children">
      {children.map(child=><PositionTree key={child.id} position={child} maps={maps} onSelect={onSelect} canEditProcesses={canEditProcesses} ancestors={[...ancestors,position.id]}/>)}
    </div>}
  </div>;
}
