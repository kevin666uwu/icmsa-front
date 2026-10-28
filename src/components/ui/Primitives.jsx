import { useId, useRef, useState } from 'react';
export function Button({ children, variant = 'primary', type = 'button', ...props }) {
  return <button type={type} className={`button ${variant}`} {...props}>{children}</button>;
}
export function Input({ label, id, error, ...props }) {
  const generated = useId(); const fieldId = id || generated;
  return <label className="field" htmlFor={fieldId}>{label}<input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} {...props} />{error && <span id={`${fieldId}-error`}>{error}</span>}</label>;
}
export function Select({ label, children, ...props }) {
  const id = useId();
  return <label className="field" htmlFor={id}>{label}<select id={id} {...props}>{children}</select></label>;
}
export function Card({ children, className = '' }) { return <section className={`card ${className}`}>{children}</section>; }
export function ResponsiveContainer({ children }) { return <div className="container">{children}</div>; }
export function Table({ caption, columns, rows }) {
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}><table className="responsive-table"><caption>{caption}</caption><thead><tr>{columns.map(c => <th scope="col" key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key} data-label={c.label}>{c.render ? c.render(row) : String(row[c.key] ?? '')}</td>)}</tr>)}</tbody></table></div>;
}
export function Tabs({ items, label = 'Secciones' }) {
  const [active, setActive] = useState(0); const id = useId(); const refs = useRef([]);
  const select = index => { setActive(index); refs.current[index]?.focus(); };
  return <div><div role="tablist" aria-label={label}>{items.map((item, i) => <button key={item.label} ref={el => { refs.current[i] = el; }} id={`${id}-tab-${i}`} role="tab" aria-controls={`${id}-panel-${i}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); select(event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length);
  }}>{item.label}</button>)}</div>{items.map((item, i) => <div key={item.label} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== active} tabIndex={0}>{item.content}</div>)}</div>;
}
export function Toast({ message, onDismiss }) {
  return message ? <div className="toast" role="status">{message}<Button variant="secondary" onClick={onDismiss} aria-label="Cerrar notificación">Cerrar</Button></div> : null;
}

