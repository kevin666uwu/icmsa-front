import { useCallback, useState } from 'react';
import { Modal } from '../components/ui/Modal.jsx';
import { useAction, useRemote } from '../hooks/useRemote.js';
import { ErrorState, LoadingState } from '../components/feedback/AsyncState.jsx';
import { allRecords, displayName, write } from './api.js';

export default function ResourceForm({ spec, access, record, onClose, onSaved }) {
  const action = useAction();
  const [values, setValues] = useState(() => Object.fromEntries(Object.entries(spec.fields).map(([key, field]) =>
    [key, record?.[key] ?? field.default ?? (field.type === 'boolean' ? false : '')])));
  const loader = useCallback(async signal => {
    const refs = [...new Set(Object.values(spec.fields).filter(f => f.reference && f.reference !== 'users').map(f => f.reference))];
    const entries = await Promise.all(refs.map(async key => [key, access.resources[key] ? await allRecords(access.resources[key].path, signal) : []]));
    return Object.fromEntries(entries);
  }, [spec, access]);
  const remote = useRemote(loader);
  function submit(event) {
    event.preventDefault();
    action.run(async () => {
      const payload = Object.fromEntries(Object.entries(spec.fields).map(([key, field]) => {
        let value = values[key];
        if (value === '' && !field.required) value = null;
        else if (['reference', 'integer'].includes(field.type)) value = Number(value);
        return [key, value];
      }));
      await write(spec.path + (record ? '/' + record.id : ''), payload, record ? 'PATCH' : 'POST');
      onSaved();
    });
  }
  return <Modal title={(record ? 'Editar ' : 'Agregar · ') + spec.title} onClose={onClose}>
    {remote.loading ? <LoadingState /> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh} /> :
      <form className="entity-form" onSubmit={submit}>
        {Object.entries(spec.fields).map(([key, field]) => {
          const props = { id: 'field-' + key, name: key, required: field.required, disabled: action.busy,
            value: values[key] ?? '', onChange: e => setValues(v => ({ ...v, [key]: field.type === 'boolean' ? e.target.checked : e.target.value })) };
          let input;
          if (field.type === 'boolean') input = <input {...props} type="checkbox" checked={Boolean(values[key])} />;
          else if (field.type === 'textarea') input = <textarea {...props} rows={3} maxLength={12000} />;
          else if (field.choices) input = <select {...props}>{field.choices.map(value => <option key={value} value={value}>{value}</option>)}</select>;
          else if (field.reference && field.reference !== 'users') {
            let options = remote.data[field.reference] || [];
            if (key === 'area_id' && values.department_id) options = options.filter(row => row.department_id === Number(values.department_id));
            if (key === 'parent_position_id' && record) options = options.filter(row => row.id !== record.id);
            input = <select {...props}><option value="">Seleccionar…</option>{options.map(row => <option key={row.id} value={row.id}>{displayName(row)} · #{row.id}</option>)}</select>;
          } else input = <input {...props} type={['integer', 'reference', 'decimal'].includes(field.type) ? 'number' : field.type === 'datetime' ? 'datetime-local' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
            step={field.type === 'decimal' ? '0.0001' : undefined} min={['integer', 'reference'].includes(field.type) ? (field.type === 'reference' ? 1 : 0) : undefined} maxLength={field.max_length || 255} />;
          return <label key={key} htmlFor={props.id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}{input}</label>;
        })}
        {action.error && <ErrorState message={action.error} />}
        <div className="form-actions"><button className="button primary" disabled={action.busy} type="submit">{action.busy ? 'Guardando…' : 'Guardar'}</button><button type="button" className="button secondary" onClick={onClose}>Cancelar</button></div>
      </form>}
  </Modal>;
}
