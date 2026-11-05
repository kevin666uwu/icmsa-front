import { useCallback, useMemo, useState } from 'react';
import { useAction, useRemote } from '../../hooks/useRemote.js';
import { ErrorState, LoadingState } from '../../components/feedback/AsyncState.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import ResourcePage from '../ResourcePage.jsx';
import ResourceForm from '../ResourceForm.jsx';
import { read, write } from '../api.js';

const money = value => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(value || 0));
const statuses = {pending:'Pendiente',partial:'Abono parcial',paid:'Pagado',overdue:'Vencido',cancelled:'Cancelado'};
const expenseColumns = ['concept','category','supplier','amount','due_date','paid_date','status'];
const chargeSpec = {title:'Cargo al alumno',path:'/operations/charges',permission:'finance',fields:{
  student_id:{label:'Alumno',type:'reference',reference:'students',required:true},
  concept:{label:'Concepto',type:'text',required:true},
  amount:{label:'Importe (MXN)',type:'decimal',required:true,min:0.01,step:'0.01'},
  due_date:{label:'Fecha límite de pago',type:'date'},
  cancelled:{label:'Cargo cancelado',type:'boolean',default:false},
}};
function localDate() {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = type => parts.find(item=>item.type===type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function PaymentWindow({ charge, canWrite, onClose, onSaved }) {
  const loader=useCallback(signal=>read('/operations/charges/'+charge.id+'/payments',signal),[charge.id]);
  const remote=useRemote(loader),action=useAction();
  const [amount,setAmount]=useState(''),[date,setDate]=useState(localDate),[reference,setReference]=useState('');
  const [key,setKey]=useState(()=>crypto.randomUUID());
  const current=remote.data?.charge;
  const legacy=Number(current?.paid_amount || 0)-(remote.data?.items || []).reduce((sum,row)=>sum+Number(row.amount),0);
  function submit(e) {
    e.preventDefault();
    action.run(async()=>{
      await write('/operations/charges/'+charge.id+'/payments',{amount,payment_date:date,reference:reference || null,idempotency_key:key});
      setAmount('');setReference('');setKey(crypto.randomUUID());remote.refresh();onSaved();
    });
  }
  return <Modal title="Abonos y saldo del cargo" className="resource-dialog" onClose={onClose}>
    <p><strong>{charge.student_name}</strong> · {charge.concept}</p>
    {remote.loading ? <LoadingState/> : remote.error ? <ErrorState message={remote.error} onRetry={remote.refresh}/> : <>
      <p>Importe: <strong>{money(current.amount)}</strong> · Recibido: <strong>{money(current.paid_amount)}</strong> · Saldo: <strong>{money(current.balance)}</strong></p>
      {legacy>0 && <p className="muted">Abonos anteriores al historial de este módulo: {money(legacy)}.</p>}
      {remote.data.items.length ? <div className="table-scroll"><table><caption>Historial de abonos</caption><thead><tr><th>Fecha</th><th>Importe</th><th>Referencia</th></tr></thead><tbody>{remote.data.items.map(item=><tr key={item.id}><td>{item.payment_date}</td><td>{money(item.amount)}</td><td>{item.reference || '—'}</td></tr>)}</tbody></table></div> : <p className="muted">Sin abonos registrados en este módulo.</p>}
      {canWrite && current.status!=='cancelled' && Number(current.balance)>0 && <form className="entity-form operations-payment-form" onSubmit={submit}>
        <label><span>Abono (MXN)</span><input autoFocus required type="number" min="0.01" max={current.balance} step="0.01" value={amount} disabled={action.busy} onChange={e=>setAmount(e.target.value)}/></label>
        <label><span>Fecha de recepción</span><input required type="date" value={date} disabled={action.busy} onChange={e=>setDate(e.target.value)}/></label>
        <label><span>Referencia del pago</span><input maxLength={255} value={reference} disabled={action.busy} onChange={e=>setReference(e.target.value)}/></label>
        <div className="form-actions"><button className="button primary" disabled={action.busy}>{action.busy?'Registrando…':'Registrar abono'}</button></div>
      </form>}
    </>}
    {action.error && <ErrorState message={action.error}/>}
  </Modal>;
}

export default function FinancePage({ access }) {
  const [tab,setTab]=useState('charges'),[q,setQ]=useState(''),[status,setStatus]=useState(''),[offset,setOffset]=useState(0);
  const [editing,setEditing]=useState(undefined),[payment,setPayment]=useState(null),[notice,setNotice]=useState('');
  const canWrite=access.permissions.includes('finance.write');
  const loader=useCallback(signal=>read('/operations/finance?'+new URLSearchParams({q,status,offset,limit:25}),signal),[q,status,offset]);
  const remote=useRemote(loader);
  const expenses=useMemo(()=>{
    const spec=access.resources?.operating_expenses;
    return spec && {...spec,fields:{...spec.fields,amount:{...spec.fields.amount,min:0.01,step:'0.01'},status:{...spec.fields.status,choice_labels:statuses}}};
  },[access]);
  function saved() {setEditing(undefined);setNotice('Cambios guardados.');remote.refresh();}
  const summary=remote.data?.summary;
  return <section className="operations-page">
    <div className="page-heading"><div><p className="eyebrow">Operación</p><h1>Finanzas</h1><p>Gestiona cobros al alumnado, abonos recibidos y gastos operativos. Importes en pesos mexicanos (MXN).</p></div></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {summary && <><p className="muted">Resumen institucional de todos los registros, independiente de los filtros de cobros.</p><div className="metrics operations-finance-summary">{[
      ['Cargos vigentes',summary.expected],['Dinero recibido',summary.received],['Cobros pendientes',summary.balance],['Saldo vencido',summary.overdue],
      ['Gastos pagados',summary.paid_expenses],['Gastos por pagar',summary.pending_expenses],['Flujo neto registrado',summary.net],
    ].map(([label,value])=><article className="metric" key={label}><span>{label}</span><strong>{money(value)}</strong></article>)}</div><p className="muted">Flujo neto registrado = abonos recibidos − gastos pagados. Los cargos cancelados se excluyen del resumen.</p></>}
    <div className="personnel-tabs" role="tablist" aria-label="Gestión de finanzas">{[['charges','Cobros y abonos'],['expenses','Gastos operativos']].map(([key,label])=><button type="button" key={key} id={'finance-tab-'+key} role="tab" aria-selected={tab===key} aria-controls="finance-panel" onClick={()=>setTab(key)}>{label}</button>)}</div>
    {remote.error && <ErrorState message={remote.error} onRetry={remote.refresh}/>}
    <div id="finance-panel" role="tabpanel" aria-labelledby={'finance-tab-'+tab}>
      {tab==='expenses' ? expenses ? <ResourcePage embedded name="operating_expenses" spec={expenses} access={access} visibleFields={expenseColumns} onChanged={remote.refresh} description="Registra concepto, proveedor, importe, fecha programada y pago del gasto." showDetails={false}/> : <p role="status">El registro de gastos todavía no está disponible para tu cuenta.</p> : <>
        <div className="page-heading"><h2>Cobros al alumnado</h2>{canWrite && <button type="button" className="button primary" onClick={()=>setEditing(null)}>Agregar cargo</button>}</div>
        <div className="toolbar"><label>Buscar alumno, matrícula o concepto<input value={q} maxLength={120} onChange={e=>{setQ(e.target.value);setOffset(0);}}/></label><label>Estado del cobro<select value={status} onChange={e=>{setStatus(e.target.value);setOffset(0);}}><option value="">Todos</option>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
        {remote.loading ? <LoadingState/> : remote.data && <>
          {remote.data.items.length ? <div className="table-scroll"><table className="responsive-table"><caption>{remote.data.total} cargos</caption><thead><tr>{['Alumno','Concepto','Importe','Recibido','Saldo','Vencimiento','Estado','Acciones'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{remote.data.items.map(row=><tr key={row.id}>
            <td data-label="Alumno">{row.student_name}<br/><small>{row.student_number}</small></td><td data-label="Concepto">{row.concept}</td><td data-label="Importe">{money(row.amount)}</td><td data-label="Recibido">{money(row.paid_amount)}</td><td data-label="Saldo">{money(row.balance)}</td><td data-label="Vencimiento">{row.due_date || 'Sin fecha'}</td><td data-label="Estado">{statuses[row.status]}</td>
            <td data-label="Acciones"><div className="row-actions"><button type="button" onClick={()=>setPayment(row)}>Abonos y saldo</button>{canWrite && <button type="button" onClick={()=>setEditing({...row,cancelled:row.status==='cancelled'})}>Editar cargo</button>}</div></td>
          </tr>)}</tbody></table></div> : <div className="empty-panel"><h2>Sin cobros para mostrar</h2><p>{q || status ? 'Ajusta los filtros para ampliar la búsqueda.' : 'Agrega un cargo para comenzar el seguimiento de pagos del alumnado.'}</p></div>}
          <div className="pagination"><button disabled={!offset} onClick={()=>setOffset(value=>Math.max(0,value-25))}>Anterior</button><span>Página {offset/25+1}</span><button disabled={offset+25>=remote.data.total} onClick={()=>setOffset(value=>value+25)}>Siguiente</button></div>
        </>}
      </>}
    </div>
    {editing!==undefined && <ResourceForm spec={chargeSpec} access={access} record={editing} onClose={()=>setEditing(undefined)} onSaved={saved}/>}
    {payment && <PaymentWindow charge={payment} canWrite={canWrite} onClose={()=>setPayment(null)} onSaved={()=>{setNotice('Abono registrado.');remote.refresh();}}/>}
  </section>;
}
