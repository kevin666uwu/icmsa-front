import { Button } from '../ui/Primitives.jsx';
import ArchangelLoader from './ArchangelLoader.jsx';
export function Skeleton() { return <div className="skeleton" aria-hidden="true" />; }
export function LoadingState({ label = 'Cargando…' }) { return <div className="archangel-loading" role="status" aria-label={label}><ArchangelLoader/><span className="archangel-sr-label">{label}</span></div>; }
export function EmptyState({ title = 'Sin información', description, action }) { return <section className="empty" aria-live="polite"><h2>{title}</h2>{description && <p>{description}</p>}{action}</section>; }
export function ErrorState({ message, onRetry }) { return <div className="error" role="alert"><p>{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}</div>; }

