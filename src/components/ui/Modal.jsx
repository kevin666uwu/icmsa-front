import { useEffect, useId, useRef } from 'react';
import { Button } from './Primitives.jsx';
export function Modal({ title, children, onClose, className = '' }) {
  const titleId = useId(); const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current; const previous = document.activeElement;
    node.showModal();
    return () => { node.close(); previous?.focus?.(); };
  }, []);
  return <dialog className={`dialog ${className}`} ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="dialog-heading"><h2 id={titleId}>{title}</h2><Button variant="secondary" onClick={onClose} aria-label="Cerrar diálogo">Cerrar</Button></div>{children}
  </dialog>;
}
export function Drawer(props) { return <Modal {...props} className="drawer" />; }
