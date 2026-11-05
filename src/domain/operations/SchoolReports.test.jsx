import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RetentionPage, SchoolIndicatorsPage } from './SchoolReports.jsx';
import ModulesPage from './ModulesPage.jsx';
import { apiFetch } from '../../services/api.js';

vi.mock('../../services/api.js',()=>({apiFetch:vi.fn()}));
afterEach(()=>vi.resetAllMocks());

it('muestra las seis tarjetas y conserva Retención e Indicadores dentro de Módulos',async()=>{
  apiFetch.mockResolvedValue({items:[]});
  render(<ModulesPage access={{permissions:['admissions.read','student_services.read','students.read','finance.read','indicators.read']}}/>);
  expect(await screen.findByRole('link',{name:'Abrir Retención'})).toHaveAttribute('href','/portal/operacion/retencion');
  expect(screen.getByRole('link',{name:'Abrir Indicadores'})).toHaveAttribute('href','/portal/operacion/indicadores');
  expect(screen.getAllByRole('link',{name:/^Abrir /})).toHaveLength(6);
});

it('explica la falta de cohorte histórica y aplica los filtros sin fabricar un porcentaje',async()=>{
  apiFetch.mockResolvedValue({distribution:{},programs:[],current_permanence:null,cohort:{initial:0,active_at_end:0,graduated:0,not_continuing:0,retention_rate:null},tracking_since:null,finance_visible:false,items:[],total:0});
  render(<RetentionPage/>);
  expect(await screen.findByText(/No hay una cohorte observada/)).toBeTruthy();
  expect(screen.getAllByText('Sin datos')).toHaveLength(2);
  expect(screen.queryByRole('columnheader',{name:'Saldo vencido'})).toBeNull();
  fireEvent.change(screen.getByLabelText('Desde'),{target:{value:'2020-01-01'}});
  fireEvent.change(screen.getByLabelText('Hasta'),{target:{value:'2020-01-31'}});
  await userEvent.type(screen.getByLabelText('Buscar alumno o matrícula'),'A001');
  await userEvent.click(screen.getByRole('button',{name:'Aplicar filtros'}));
  await waitFor(()=>expect(apiFetch.mock.calls.at(-1)[0]).toContain('start_date=2020-01-01&end_date=2020-01-31'));
  expect(apiFetch.mock.calls.at(-1)[0]).toContain('q=A001');
});

it('resume la escuela y omite cifras financieras no autorizadas',async()=>{
  apiFetch.mockResolvedValue({as_of:'2026-11-04',students:{active:12,inactive:2},admissions:null,placements:null,incidents:{open:1},employees:{active:4},processes:{active:3},student_attendance:{present:6,late:1,absent:3},finance:null,measurements:[]});
  render(<SchoolIndicatorsPage/>);
  expect(await screen.findByText('70%')).toBeTruthy();
  expect(screen.getByText('Alumnos activos')).toBeTruthy();
  expect(screen.queryByRole('heading',{name:/Resumen financiero/})).toBeNull();
  expect(screen.getByText('Todavía no hay indicadores institucionales activos.')).toBeTruthy();
});
