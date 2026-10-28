import { useCallback } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { useRemote, useAction } from '../../hooks/useRemote.js';
import { LoadingState, ErrorState } from '../../components/feedback/AsyncState.jsx';
import { read, write } from '../api.js';
export default function IndicatorHistory({ record, canWrite, onClose }) {
  const loader=useCallback(signal=>read('/indicators/'+record.id+'/values',signal),[record.id]);
  const remote=useRemote(loader),action=useAction();
  return <Modal title={record.name} onClose={onClose}><p>{record.description} · {record.unit} · {record.frequency}</p>
    <p className="muted">Cumplimiento descriptivo: valor/meta × 100. Meta cero no produce porcentaje.</p>
    {canWrite&&<form className="entity-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);action.run(async()=>{await write('/indicators/'+record.id+'/values',Object.fromEntries(data));form.reset();remote.refresh();});}}>
      <label>Periodo<input name="period" required maxLength={100}/></label><label>Valor<input name="value" type="number" step="0.0001" required/></label><label>Meta<input name="target" type="number" step="0.0001" required defaultValue={record.target}/></label>
      {action.error&&<ErrorState message={action.error}/>}<button className="button primary" disabled={action.busy}>Registrar medición</button>
    </form>}
    {remote.loading?<LoadingState/>:remote.error?<ErrorState message={remote.error}/>:remote.data.length?<div className="table-scroll"><table className="responsive-table"><caption>Histórico de mediciones</caption><thead><tr><th>Periodo</th><th>Valor</th><th>Meta</th><th>Cumplimiento</th></tr></thead><tbody>{remote.data.map(row=><tr key={row.id}><td data-label="Periodo">{row.period}</td><td data-label="Valor">{row.value}</td><td data-label="Meta">{row.target}</td><td data-label="Cumplimiento">{row.compliance===null?'No definido':row.compliance+'%'}</td></tr>)}</tbody></table></div>:<p>Sin mediciones. Registra el primer valor para iniciar el histórico.</p>}
  </Modal>;
}

