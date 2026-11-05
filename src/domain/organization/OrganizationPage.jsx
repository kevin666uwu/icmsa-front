import { useMemo, useState } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read } from '../api.js';
import PositionTree from './PositionTree.jsx';
import { organizationMaps } from './organizationMaps.js';
import PositionModal from './PositionModal.jsx';
const load = signal => read('/organization', signal);
export default function OrganizationPage({ access }) {
  const remote = useRemote(load), [selected, setSelected] = useState(null), [notice, setNotice] = useState('');
  const maps = useMemo(() => remote.data ? organizationMaps(remote.data) : null, [remote.data]);
  const canEdit = access.permissions.includes('organization.write') && access.permissions.includes('employees.write');
  return <section><div className="page-heading"><div><p className="eyebrow">Organización institucional</p><h1>Personas, plazas y responsabilidades</h1><p>Selecciona una plaza para consultar su ocupante, jerarquía y procesos.</p></div></div>
    {notice && <p role="status" className="notice">{notice}</p>}
    {remote.loading ? <LoadingState /> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh} /> :
      maps.positions.size ? <div className="department-org-chart">
        {[...maps.departments.values()].filter(d => d.active !== false).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)||a.name.localeCompare(b.name,'es')).map(department => {
          const roots = maps.roots.get(department.id) || [];
          const processRows = maps.processes.filter(p => p.department_id === department.id && p.status !== 'inactive');
          return <section key={department.id} className="department-org-unit" aria-label={'Departamento: '+department.name}>
            <div className="department-org-heading"><div><span className="eyebrow">Departamento</span><h2>{department.name}</h2><p>{department.description || 'Puestos y procesos asociados al departamento.'}</p></div><span>{roots.length} plazas principales</span></div>
            {roots.length?<div className="org-canvas"><ul className="org-tree">{roots.map(p=><PositionTree key={p.id} position={p} maps={maps} onSelect={setSelected}/>)}</ul></div>:<p className="muted">Todavía no hay puestos vinculados a este departamento.</p>}
            <div className="department-processes"><h3>Procesos del departamento</h3>{processRows.length?<ul>{processRows.map(p=><li key={p.id}>{p.name}{p.area_id&&maps.areas.get(p.area_id)?' · '+maps.areas.get(p.area_id).name:''}</li>)}</ul>:<p className="muted">Sin procesos registrados.</p>}</div>
          </section>;
        })}
      </div> :
      <div className="empty-panel"><h2>El organigrama está listo para crecer</h2><p>Registra puestos directamente en un departamento. Las áreas funcionales son opcionales y las vacantes aparecen en el organigrama.</p><a href="/portal/organizacion/puestos">Consultar puestos</a></div>}
    {selected && maps && <PositionModal position={selected} maps={maps} canEdit={canEdit} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setNotice('Organización actualizada.'); remote.refresh(); }} />}
  </section>;
}
