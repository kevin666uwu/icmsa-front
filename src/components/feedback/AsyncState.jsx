import { Button } from '../ui/Primitives.jsx';
export function Skeleton() { return <div className="skeleton" aria-hidden="true" />; }
export function LoadingState({ label = 'Cargando…' }) { return <div role="status"><p>{label}</p><Skeleton /></div>; }
export function EmptyState({ title = 'Sin información', description, action }) { return <section className="empty" aria-live="polite"><h2>{title}</h2>{description && <p>{description}</p>}{action}</section>; }
export function ErrorState({ message, onRetry }) { return <div className="error" role="alert"><p>{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Reintentar</Button>}</div>; }
