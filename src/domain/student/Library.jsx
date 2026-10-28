import { useCallback, useState } from 'react';
import { useRemote } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read } from '../api.js';

function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export default function Library() {
  const [q, setQ] = useState(''), [subject, setSubject] = useState(''), [offset, setOffset] = useState(0);
  const loader = useCallback(signal => read('/student-portal/library?' + new URLSearchParams({ q, offset, limit: 25, ...(subject ? { subject_id: subject } : {}) }), signal), [q, subject, offset]);
  const remote = useRemote(loader);
  function filter(setter, value) { setter(value); setOffset(0); }
  return <section className="campus-page">
    <p className="campus-kicker">Recursos académicos</p><h1>Biblioteca digital</h1>
    <p className="campus-page-intro">Encuentra bibliografía de tu carrera y materiales de consulta general.</p>
    <div className="toolbar"><label>Buscar por título, autor o tema<input value={q} maxLength={120} onChange={e => filter(setQ, e.target.value)} placeholder="¿Qué quieres consultar?" /></label>
      <label>Materia<select value={subject} onChange={e => filter(setSubject, e.target.value)}><option value="">Todas las materias</option>{remote.data?.subjects?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label></div>
    {remote.loading ? <LoadingState label="Buscando recursos…" /> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh} /> : <>
      <p role="status">{remote.data.total} recursos disponibles</p>
      {remote.data.items.length ? <div className="library-grid">{remote.data.items.map(row => <article className="campus-card library-card" key={row.id}>
        <small>{row.bibliography_type === 'basic' ? 'Bibliografía básica' : 'Bibliografía complementaria'} · {row.subject_name || 'Consulta general'}</small>
        <h2>{row.name}</h2><p><strong>{row.author}</strong></p>
        <p>{[row.publisher, row.edition, row.publication_year].filter(Boolean).join(' · ')}</p>
        {row.description && <p className="library-description">{row.description}</p>}
        {safeUrl(row.url) && <a className="button primary" href={safeUrl(row.url)} target="_blank" rel="noopener noreferrer">Consultar recurso <span className="sr-only">(abre en otra pestaña)</span></a>}
      </article>)}</div> : <div className="campus-empty"><strong>{q || subject ? 'No hay coincidencias' : 'Aún no hay recursos publicados'}</strong><p>{q || subject ? 'Prueba con otro título, autor o materia.' : 'Los materiales de tu carrera aparecerán aquí cuando la institución los publique.'}</p></div>}
      <div className="pagination"><button disabled={!offset} onClick={() => setOffset(v => Math.max(0, v - 25))}>Anterior</button><span>Página {offset / 25 + 1}</span><button disabled={offset + 25 >= remote.data.total} onClick={() => setOffset(v => v + 25)}>Siguiente</button></div>
    </>}
  </section>;
}
