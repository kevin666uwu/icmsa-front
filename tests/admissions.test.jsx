import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmissionForm from '../src/domain/admissions/AdmissionForm.jsx';
import AdmissionsPage from '../src/domain/admissions/AdmissionsPage.jsx';
import PublicSite from '../src/domain/PublicSite.jsx';
import { curpError } from '../src/domain/admissions/curp.js';
import { visibleNavigation } from '../src/domain/navigation.js';
afterEach(()=>vi.unstubAllGlobals());
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
async function fill(){
 for(const [label,value] of [[/^Nombre\(s\)/,'Persona'],[/^Primer apellido/,'Sintética'],[/^Fecha de nacimiento/,'2000-01-01'],[/^CURP/,'gode000101hdfmnsa3'],[/^Correo electrónico/,'aspirante@example.com'],[/^Teléfono de contacto/,'5512345678'],[/^Ciudad o municipio/,'Coacalco'],[/^Estado de residencia/,'México'],[/^Institución de procedencia/,'Institución de prueba'],[/^Nombre de los estudios/,'Bachillerato general'],[/^Año de egreso/,'2020'],[/^Promedio obtenido/,'9.25'],[/^¿Por qué quieres/,'Quiero estudiar ciencias de la salud para ayudar a las personas y desarrollar mi vocación.']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 await userEvent.selectOptions(screen.getByLabelText(/^Grado de estudios/),'Bachillerato');
 await userEvent.selectOptions(screen.getByLabelText(/^Situación de los estudios/),'Concluidos');
 await userEvent.click(screen.getByRole('checkbox'));
}
it('opens a program-specific admission form from the academic offer',async()=>{
 render(<PublicSite/>);
 await userEvent.click(screen.getByRole('button',{name:/Solicitud de admisión · Médico Cirujano/}));
 expect(within(screen.getByRole('dialog')).getByLabelText(/^Programa académico/)).toHaveValue('Médico Cirujano');
});
it('submits required academic and contact data and displays only a receipt',async()=>{
 const fetcher=vi.fn(async()=>response({folio:'ICMSA-TEST-123',status:'received'}));vi.stubGlobal('fetch',fetcher);
 render(<AdmissionForm initialProgram="Médico Cirujano" onClose={vi.fn()}/>);await fill();
 await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud de admisión'}));
 expect(await screen.findByText('ICMSA-TEST-123')).toBeInTheDocument();
 const payload=JSON.parse(fetcher.mock.calls[0][1].body);
 expect(payload).toMatchObject({program:'Médico Cirujano',curp:'GODE000101HDFMNSA3',average:9.25,average_scale:10,consent:true,graduation_year:2020});
 expect(payload.submission_id).toMatch(/^[a-f0-9-]{36}$/);
 expect(screen.queryByLabelText(/^CURP/)).not.toBeInTheDocument();
});
it('blocks a CURP that disagrees with the date of birth before sending',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 render(<AdmissionForm initialProgram="Médico Cirujano" onClose={vi.fn()}/>);await fill();
 fireEvent.change(screen.getByLabelText(/^Fecha de nacimiento/),{target:{value:'2001-01-01'}});
 await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud de admisión'}));
 expect(screen.getByRole('alert')).toHaveTextContent('no coincide');expect(fetcher).not.toHaveBeenCalled();
});
it('reuses the submission identifier after a network failure',async()=>{
 const fetcher=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response({folio:'ICMSA-RETRY',status:'received'}));vi.stubGlobal('fetch',fetcher);
 render(<AdmissionForm initialProgram="Médico Cirujano" onClose={vi.fn()}/>);await fill();
 await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud de admisión'}));await screen.findByRole('alert');
 await userEvent.click(screen.getByRole('button',{name:'Enviar solicitud de admisión'}));await screen.findByText('ICMSA-RETRY');
 expect(JSON.parse(fetcher.mock.calls[0][1].body).submission_id).toBe(JSON.parse(fetcher.mock.calls[1][1].body).submission_id);
});
it('checks structure, real dates, date matching and check digits',()=>{
 expect(curpError('GODE000101HDFMNSA3','2000-01-01')).toBe('');
 expect(curpError('GODE000101HDFMNSA4','2000-01-01')).toContain('dígito');
 expect(curpError('GODE000231HDFMNSA3','2000-02-01')).toContain('fecha');
 expect(curpError('GODE000101HDFMNSA3','2001-01-01')).toContain('no coincide');
});
it('lists admissions in the dedicated department and saves a review',async()=>{
 const row={id:1,folio:'ICMSA-123',first_name:'Persona',last_name:'Prueba',program:'Médico Cirujano',email:'a@example.com',phone:'5512345678',status:'received',created_at:'2026-10-28T10:00:00',curp:'GODE000101HDFMNSA3',motivation:'Quiero ingresar para estudiar y servir.',average:'9.25',average_scale:10,consent:true,consent_version:'v1'};
 const fetcher=vi.fn(async(url,options)=>response(options?.method==='PATCH'?{id:1,status:'in_review'}:new URL(url).pathname.endsWith('/1')?row:{items:[row],total:1}));vi.stubGlobal('fetch',fetcher);
 render(<AdmissionsPage/>);await userEvent.click(await screen.findByRole('button',{name:'Ver solicitud'}));
 await screen.findByText(row.motivation);
 await userEvent.selectOptions(screen.getByLabelText('Estado de la solicitud'),'in_review');
 await userEvent.click(screen.getByRole('button',{name:'Guardar seguimiento'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 expect(fetcher.mock.calls.some(([,options])=>options?.method==='PATCH'&&JSON.parse(options.body).status==='in_review')).toBe(true);
 const allowed=visibleNavigation({role:'super_admin',permissions:['admissions.read'],resources:{}});
 expect(allowed.find(x=>x.type==='admissions').group).toBe('Admisión');
 expect(visibleNavigation({role:'employee',permissions:[],resources:{}}).some(x=>x.type==='admissions')).toBe(false);
});
