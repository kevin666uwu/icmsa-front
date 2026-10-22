import { useState } from 'react';
import { apiFetch } from '../../services/api.js';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { Button, Table } from '../../components/ui/Primitives.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { useCallback } from 'react';
export default function Users({ currentUser }) {
  const [offset, setOffset] = useState(0);
  const loader = useCallback(signal => apiFetch(`/api/v1/users?offset=${offset}&limit=20`, { signal }), [offset]);
  const result = useRemote(loader); const action = useAction();
  if (result.loading) return <LoadingState />;
  if (result.error) return <ErrorState message={result.error} onRetry={result.refresh} />;
  const columns = [{ key: 'name', label: 'Nombre' }, { key: 'email', label: 'Correo' }, { key: 'role', label: 'Rol' }, { key: 'active', label: 'Estado', render: row => row.active ? 'Activo' : 'Inactivo' },
    { key: 'actions', label: 'Acciones', render: row => <Button variant="secondary" disabled={row.id === currentUser.id || action.busy} onClick={() => action.run(async () => { await apiFetch(`/api/v1/users/${row.id}`, { method: 'PATCH', body: JSON.stringify({ active: !row.active }) }); result.refresh(); })}>{row.active ? 'Desactivar' : 'Activar'}</Button> }];
  return <><h1>Administración de usuarios</h1>{action.error && <ErrorState message={action.error} />}{result.data.length ? <Table caption="Usuarios" columns={columns} rows={result.data} /> : <EmptyState title="Sin usuarios en esta página" />}<div className="actions"><Button variant="secondary" disabled={!offset} onClick={() => setOffset(offset - 20)}>Anterior</Button><Button variant="secondary" disabled={result.data.length < 20} onClick={() => setOffset(offset + 20)}>Siguiente</Button></div></>;
}
