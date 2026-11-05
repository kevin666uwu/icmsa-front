import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OperationsPage from './OperationsPage.jsx';
import FinancePage from './FinancePage.jsx';
import AdmissionsPage from '../admissions/AdmissionsPage.jsx';
import { apiFetch } from '../../services/api.js';

vi.mock('../../services/api.js',()=>({apiFetch:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
const students={path:'/students',title:'Alumnos',permission:'students',fields:{
  student_number:{label:'Matrícula',type:'text',required:true},first_name:{label:'Nombre',type:'text',required:true},last_name:{label:'Primer apellido',type:'text',required:true},
}};
const attendance={path:'/operations/student-attendance',title:'Asistencia del alumnado',permission:'students',fields:{
  student_id:{label:'Alumno',type:'reference',reference:'students',required:true},date:{label:'Fecha',type:'date',required:true},status:{label:'Estado',type:'choice',choices:['present','absent'],default:'present',required:true},
}};
const person={id:1,student_number:'A001',first_name:'Andrea',last_name:'Demo'};
const access={permissions:['students.read','students.write','finance.read','finance.write'],resources:{students,student_attendance:attendance}};

it('registra asistencia estudiantil en su módulo y muestra al alumno por nombre',async()=>{
  apiFetch.mockImplementation(async(path,options)=>options?.method==='POST' ? {id:2} : path.startsWith('/api/v1/students') ? {items:[person],total:1} : {items:[],total:0});
  render(<OperationsPage type="students" access={access}/>);
  await userEvent.click(screen.getByRole('tab',{name:'Asistencia'}));
  await userEvent.click(await screen.findByRole('button',{name:'Crear primer registro'}));
  const modal=screen.getByRole('dialog');
  await userEvent.selectOptions(await within(modal).findByRole('combobox',{name:'Alumno'}),'1');
  fireEvent.change(within(modal).getByLabelText(/^Fecha/),{target:{value:'2026-11-04'}});
  await userEvent.selectOptions(within(modal).getByRole('combobox',{name:'Estado'}),'absent');
  await userEvent.click(within(modal).getByRole('button',{name:'Guardar'}));
  await waitFor(()=>expect(apiFetch).toHaveBeenCalledWith('/api/v1/operations/student-attendance',expect.objectContaining({method:'POST',body:JSON.stringify({student_id:1,date:'2026-11-04',status:'absent'})})));
});

it('registra abonos con identificador de reintento y actualiza el saldo',async()=>{
  let paid=0;
  const charge=()=>({id:1,student_id:1,student_name:'Andrea Demo',student_number:'A001',concept:'Colegiatura',amount:'100.00',paid_amount:String(paid),balance:String(100-paid),status:paid?'partial':'pending'});
  apiFetch.mockImplementation(async(path,options)=>{
    if(path.includes('/charges/1/payments')) {
      if(options?.method==='POST') {paid+=Number(JSON.parse(options.body).amount);return {id:1};}
      return {charge:charge(),items:[]};
    }
    if(path.includes('/operations/finance')) return {items:[charge()],total:1,summary:{expected:100,received:paid,balance:100-paid,net:paid,paid_expenses:0,pending_expenses:0,overdue:0}};
    return {items:[person],total:1};
  });
  render(<FinancePage access={access}/>);
  await userEvent.click(await screen.findByRole('button',{name:'Abonos y saldo'}));
  const modal=screen.getByRole('dialog',{name:'Abonos y saldo del cargo'});
  await userEvent.type(await within(modal).findByLabelText('Abono (MXN)'),'25');
  await userEvent.click(within(modal).getByRole('button',{name:'Registrar abono'}));
  await waitFor(()=>expect(paid).toBe(25));
  const call=apiFetch.mock.calls.find(([,options])=>options?.method==='POST');
  expect(JSON.parse(call[1].body)).toMatchObject({amount:'25',idempotency_key:expect.any(String)});
  expect(JSON.parse(call[1].body).idempotency_key.length).toBeGreaterThan(16);
  await waitFor(()=>expect(within(modal).getByText('$75.00')).toBeTruthy());
});

it('abre Admisión con solicitudes pendientes y permite consultar todas',async()=>{
  apiFetch.mockResolvedValue({items:[],total:0});
  render(<AdmissionsPage defaultPending canWrite={false}/>);
  await screen.findByText('No hay coincidencias');
  expect(apiFetch.mock.calls[0][0]).toContain('pending=true');
  await userEvent.selectOptions(screen.getByLabelText('Estado'),'');
  await waitFor(()=>expect(apiFetch.mock.calls.at(-1)[0]).not.toContain('pending=true'));
});
