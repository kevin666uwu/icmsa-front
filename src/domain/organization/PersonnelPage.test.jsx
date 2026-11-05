import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonnelPage from './PersonnelPage.jsx';

const employees = { title: 'Personal', path: '/employees', permission: 'employees', fields: {
  first_name: { label: 'Nombre', type: 'text', required: true },
  last_name: { label: 'Apellidos', type: 'text', required: true },
  employee_number: { label: 'Número de empleado', type: 'text', required: true },
  status: { label: 'Estado', type: 'choice', choices: ['active', 'inactive'], default: 'active' },
  user_id: { label: 'Usuario relacionado', type: 'reference', reference: 'users' },
} };
const attendance = { title: 'Asistencia', path: '/attendance', permission: 'attendance', fields: {
  employee_id: { label: 'Empleado', type: 'reference', reference: 'employees', required: true },
  date: { label: 'Fecha', type: 'date', required: true },
  status: { label: 'Estado', type: 'choice', choices: ['present', 'vacation'], default: 'present' },
  notes: { label: 'Notas', type: 'textarea' },
} };
const access = { permissions: ['employees.read','employees.write','attendance.read','attendance.write'], resources: { employees, attendance_records: attendance } };
const response = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
afterEach(()=>vi.unstubAllGlobals());

it('crea un expediente sin crear ni pedir una cuenta de acceso', async () => {
  const fetcher = vi.fn(async () => response({items:[],total:0}));
  vi.stubGlobal('fetch', fetcher);
  render(<PersonnelPage access={access}/>);
  await userEvent.click(await screen.findByRole('button',{name:'Crear primer registro'}));
  const modal = screen.getByRole('dialog');
  await userEvent.type(await within(modal).findByLabelText(/Nombre/),'Andrea');
  await userEvent.type(within(modal).getByLabelText(/Apellidos/),'Demo');
  await userEvent.type(within(modal).getByLabelText(/Número de empleado/),'EMP-001');
  expect(within(modal).queryByLabelText(/Usuario relacionado/)).toBeNull();
  await userEvent.click(within(modal).getByRole('button',{name:'Guardar'}));
  const posted = fetcher.mock.calls.find(([,options])=>options.method==='POST');
  expect(posted[0]).toContain('/employees');
  expect(JSON.parse(posted[1].body)).toEqual({first_name:'Andrea',last_name:'Demo',employee_number:'EMP-001',status:'active'});
});

it('filtra vacaciones y guarda el día en el historial de asistencia', async () => {
  const fetcher = vi.fn(async url => response(String(url).includes('/employees')
    ? {items:[{id:7,first_name:'Andrea',last_name:'Demo'}],total:1} : {items:[],total:0}));
  vi.stubGlobal('fetch', fetcher);
  render(<PersonnelPage access={access}/>);
  await userEvent.click(screen.getByRole('tab',{name:'Vacaciones'}));
  await userEvent.click(await screen.findByRole('button',{name:'Crear primer registro'}));
  const modal=screen.getByRole('dialog');
  await userEvent.selectOptions(await within(modal).findByLabelText(/Empleado/),'7');
  const date=within(modal).getByLabelText(/Fecha/);
  // Date input values use the browser's ISO representation.
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(date,{target:{value:'2026-11-06'}});
  await userEvent.click(within(modal).getByRole('button',{name:'Guardar'}));
  expect(fetcher.mock.calls.some(([url])=>String(url).includes('status=vacation'))).toBe(true);
  const posted=fetcher.mock.calls.find(([,options])=>options.method==='POST');
  expect(posted[0]).toContain('/attendance');
  expect(JSON.parse(posted[1].body)).toMatchObject({employee_id:7,date:'2026-11-06',status:'vacation'});
});
