import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModulesPage from './ModulesPage.jsx';
import ProcessModules from '../processes/ProcessModules.jsx';
import { apiFetch } from '../../services/api.js';

vi.mock('../../services/api.js',()=>({apiFetch:vi.fn()}));
afterEach(()=>vi.resetAllMocks());

it('muestra tarjetas autorizadas con sus procesos y acceso al módulo',async()=>{
  apiFetch.mockResolvedValue({items:[{key:'students',processes:[{id:7,name:'Control de expedientes'}]}]});
  render(<ModulesPage access={{permissions:['students.read']}}/>);
  expect(await screen.findByText('Control de expedientes')).toBeTruthy();
  expect(screen.getByRole('link',{name:'Abrir Alumnado'})).toHaveAttribute('href','/portal/operacion/alumnado');
  expect(screen.queryByRole('link',{name:'Abrir Finanzas'})).toBeNull();
});

it('guarda y quita vínculos de módulos dentro del detalle del proceso',async()=>{
  let keys=['students'];
  apiFetch.mockImplementation(async(path,options)=>{
    if(options?.method==='PUT') keys=JSON.parse(options.body).module_keys;
    return {available:[{key:'students',name:'Alumnado'},{key:'finance',name:'Finanzas'}],module_keys:keys};
  });
  render(<ProcessModules processId={7} canManage/>);
  await userEvent.click(await screen.findByRole('button',{name:'Vincular módulos'}));
  expect(screen.getByRole('checkbox',{name:'Alumnado'})).toBeChecked();
  await userEvent.click(screen.getByRole('checkbox',{name:'Finanzas'}));
  await userEvent.click(screen.getByRole('checkbox',{name:'Alumnado'}));
  await userEvent.click(screen.getByRole('button',{name:'Guardar vínculos'}));
  await waitFor(()=>expect(apiFetch).toHaveBeenCalledWith('/api/v1/processes/7/modules',expect.objectContaining({method:'PUT',body:JSON.stringify({module_keys:['finance']})})));
  expect(await screen.findByRole('link',{name:'Finanzas'})).toBeTruthy();
  expect(screen.queryByRole('link',{name:'Alumnado'})).toBeNull();
});
