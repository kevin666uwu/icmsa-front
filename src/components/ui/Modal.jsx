import { useEffect, useId, useRef } from 'react';
import { Button } from './Primitives.jsx';
export function Modal({ title, children, onClose, className = '' }) {
  const titleId = useId(); const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current; const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => { node.close(); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, []);
  return <dialog className={`dialog ${className}`} ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="dialog-heading"><h2 id={titleId}>{title}</h2><Button variant="secondary" onClick={onClose} aria-label="Cerrar diálogo">Cerrar</Button></div><div className="dialog-body">{children}</div>
  </dialog>;
}
export function Drawer(props) { return <Modal {...props} className="drawer" />; }

