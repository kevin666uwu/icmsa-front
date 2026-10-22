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
      maps.positions.size ? <div className="org-canvas"><ul className="org-tree">{(maps.children.get(null) || []).map(p => <PositionTree key={p.id} position={p} maps={maps} onSelect={setSelected} />)}</ul></div> :
      <div className="empty-panel"><h2>El organigrama está listo para crecer</h2><p>Primero registra departamentos, áreas y plazas en Organización. Las plazas sin ocupante se muestran como vacantes.</p><a href="/portal/organizacion/puestos">Consultar puestos</a></div>}
    {selected && maps && <PositionModal position={selected} maps={maps} canEdit={canEdit} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setNotice('Organización actualizada.'); remote.refresh(); }} />}
  </section>;
}
