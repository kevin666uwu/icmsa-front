import { useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { ErrorState } from '../../components/feedback/AsyncState.jsx';
import { useAction } from '../../hooks/useRemote.js';
import { write } from '../api.js';
import { programs } from '../academicPrograms.js';
import { curpError } from './curp.js';
import './admissions.css';

export default function AdmissionForm({ initialProgram='', onClose }){
 const action=useAction(),submission=useRef(null);
 const [curp,setCurp]=useState(''),[birthDate,setBirthDate]=useState(''),[curpTouched,setCurpTouched]=useState(false),[scale,setScale]=useState('10'),[receipt,setReceipt]=useState(null);
 const curpProblem=curpError(curp,birthDate),year=new Date().getFullYear();
 function submit(event){
  event.preventDefault();const form=event.currentTarget;setCurpTouched(true);
  if(curpProblem){form.elements.curp.focus();return;}
  if(!form.reportValidity())return;
  const raw=Object.fromEntries(new FormData(form));
  const payload={...raw,curp:curp.trim().toUpperCase(),birth_date:birthDate,second_last_name:raw.second_last_name.trim()||null,average:Number(raw.average),average_scale:Number(raw.average_scale),graduation_year:Number(raw.graduation_year),consent:raw.consent==='on'};
  const fingerprint=JSON.stringify(payload);
  if(!submission.current||submission.current.fingerprint!==fingerprint)submission.current={id:crypto.randomUUID(),fingerprint};
  action.run(async()=>{const result=await write('/admissions',{...payload,submission_id:submission.current.id});setReceipt(result);});
 }
 return <Modal title="Solicitud de admisión" className="admission-dialog" onClose={onClose}>
  {receipt?<section className="admission-receipt" role="status"><span className="admission-receipt-mark" aria-hidden="true">✓</span><h2>Recibimos tu solicitud</h2><p>Conserva tu folio:</p><strong>{receipt.folio}</strong><p>El equipo de admisiones revisará tu información y podrá contactarte por los medios que registraste. El envío no confirma la admisión ni crea una cuenta de alumno.</p><button className="button primary" onClick={onClose}>Cerrar solicitud</button></section>:<>
   <p className="admission-intro">Cuéntanos sobre ti y da el primer paso para formar parte de San Angelo. Los campos marcados con * son obligatorios.</p>
   <form className="admission-form" onSubmit={submit}>
    <fieldset disabled={action.busy}><legend>01 · Programa de interés</legend><label>Programa académico *<select name="program" required defaultValue={initialProgram}><option value="">Selecciona un programa</option>{programs.map(p=><option key={p.title}>{p.title}</option>)}</select></label></fieldset>
    <fieldset disabled={action.busy}><legend>02 · Datos personales</legend><div className="admission-fields">
     <label>Nombre(s) *<input name="first_name" required maxLength={100} autoComplete="given-name"/></label>
     <label>Primer apellido *<input name="last_name" required maxLength={100} autoComplete="family-name"/></label>
     <label>Segundo apellido<input name="second_last_name" maxLength={100}/></label>
     <label>Fecha de nacimiento *<input name="birth_date" type="date" required value={birthDate} max={new Date().toISOString().slice(0,10)} onChange={e=>setBirthDate(e.target.value)}/></label>
     <label className="admission-full">CURP *<input name="curp" required minLength={18} maxLength={18} autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={curp} onChange={e=>setCurp(e.target.value.toUpperCase().replace(/\s/g,''))} onBlur={()=>setCurpTouched(true)} aria-invalid={curpTouched&&Boolean(curpProblem)} aria-describedby="admission-curp-help admission-curp-error"/></label>
     <p id="admission-curp-help" className="admission-hint admission-full">Se revisan estructura, fecha y dígito verificador. Esta revisión no consulta ni certifica tu registro ante RENAPO.</p>
     {curpTouched&&curpProblem&&<p id="admission-curp-error" className="admission-field-error admission-full" role="alert">{curpProblem}</p>}
    </div></fieldset>
    <fieldset disabled={action.busy}><legend>03 · Contacto</legend><div className="admission-fields">
     <label>Correo electrónico *<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
     <label>Teléfono de contacto *<input name="phone" type="tel" required minLength={7} maxLength={30} pattern={String.raw`[+0-9 \(\)\-]{7,30}`} autoComplete="tel" title="Escribe de 7 a 15 dígitos; puedes usar +, espacios, guiones y paréntesis."/></label>
     <label>Ciudad o municipio *<input name="city" required maxLength={150} autoComplete="address-level2"/></label>
     <label>Estado de residencia *<input name="state" required maxLength={150} autoComplete="address-level1"/></label>
    </div></fieldset>
    <fieldset disabled={action.busy}><legend>04 · Estudios anteriores</legend><div className="admission-fields">
     <label>Grado de estudios anterior *<select name="previous_level" required defaultValue=""><option value="">Selecciona el grado</option>{['Bachillerato','Técnico superior','Licenciatura','Especialidad','Maestría','Doctorado','Otro'].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Institución de procedencia *<input name="previous_institution" required minLength={2} maxLength={200}/></label>
     <label>Nombre de los estudios cursados *<input name="previous_degree" required minLength={2} maxLength={200} placeholder="Bachillerato, carrera o posgrado"/></label>
     <label>Situación de los estudios *<select name="previous_study_status" required defaultValue=""><option value="">Selecciona una opción</option>{['Concluidos','En curso','Certificado o título en trámite'].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Año de egreso o previsto *<input name="graduation_year" type="number" required min={birthDate?Number(birthDate.slice(0,4)):1900} max={year+1} step="1"/></label>
     <label>Escala del promedio *<select name="average_scale" value={scale} onChange={e=>setScale(e.target.value)}><option value="10">De 0 a 10</option><option value="100">De 0 a 100</option></select></label>
     <label>Promedio obtenido o actual *<input name="average" type="number" required min="0" max={scale} step="0.01" inputMode="decimal"/></label>
    </div></fieldset>
    <fieldset disabled={action.busy}><legend>05 · Tu motivación</legend><label>¿Por qué quieres ingresar a San Angelo? *<textarea name="motivation" required minLength={30} maxLength={5000} rows={6} placeholder="Cuéntanos tus motivos, intereses y metas académicas."/></label><p className="admission-hint">Entre 30 y 5,000 caracteres.</p></fieldset>
    <fieldset disabled={action.busy}><legend>06 · Autorización</legend><p className="admission-hint">ICMSA utilizará los datos de esta solicitud para evaluar tu interés de ingreso y contactarte. La solicitud será consultada por personal administrativo autorizado.</p><label className="admission-consent"><input type="checkbox" name="consent" required/><span>Autorizo el uso de mis datos para gestionar esta solicitud de admisión y ser contactado al respecto. *</span></label></fieldset>
    {action.error&&<ErrorState message={action.error}/>}
    <div className="admission-actions"><button type="submit" className="button primary" disabled={action.busy}>{action.busy?'Enviando solicitud…':'Enviar solicitud de admisión'}</button><button type="button" className="button secondary" disabled={action.busy} onClick={onClose}>Cancelar</button></div>
   </form>
  </>}
 </Modal>;
}
