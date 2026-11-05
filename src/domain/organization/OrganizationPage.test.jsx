import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import OrganizationPage from './OrganizationPage.jsx';
import { apiFetch } from '../../services/api.js';

vi.mock('../../services/api.js', () => ({ apiFetch: vi.fn() }));

const originalData = {
  units: [{id:11,name:'Control Escolar',parent_id:null,active:true}],
  positions: [{id:9,name:'Responsable',org_unit_id:11,parent_position_id:null,active:true}],
  memberships: [],
  users: [{id:2,name:'Andrea Demo',status:'active',role:'employee',email:null}],
  processes: [],
  process_overview: {},
};

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockResolvedValue(originalData);
});

describe('Organigrama ICMSA — réplica KPIs Web', () => {
  it('muestra los cuatro formularios y no muestra departamentos', async () => {
    render(<OrganizationPage access={{role:'super_admin'}} />);
    expect(await screen.findByRole('heading',{name:'Agregar usuario'})).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Agregar área'})).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Agregar puesto'})).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Asignar persona'})).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Organigrama jerárquico'})).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Departamentos'})).toBeNull();
    expect(screen.queryByText('Agregar departamento')).toBeNull();
    expect(screen.queryByText('Gestionar estructura y vacantes')).toBeNull();
    expect(screen.getByRole('button',{name:/Responsable/})).toBeTruthy();
  });

  it('crea áreas sin pedir departamento, con área superior opcional', async () => {
    render(<OrganizationPage access={{role:'super_admin'}} />);
    const section = await screen.findByRole('heading',{name:'Agregar área'});
    const form = section.closest('form');
    fireEvent.change(within(form).getByLabelText('Nombre'),{target:{value:'Titulación'}});
    fireEvent.change(within(form).getByLabelText('Área superior'),{target:{value:'11'}});
    fireEvent.click(within(form).getByRole('button',{name:'Crear área'}));
    await waitFor(()=>{
      expect(apiFetch).toHaveBeenCalledWith('/api/v1/organization/units',{
        method:'POST',body:JSON.stringify({name:'Titulación',parent_id:11})
      });
    });
  });

  it('permite consultar el árbol sin ofrecer creación de usuarios a lectores', async () => {
    render(<OrganizationPage access={{role:'director'}} />);
    expect(await screen.findByRole('heading',{name:'Organigrama jerárquico'})).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Agregar usuario'})).toBeNull();
    expect(screen.getByText('Control Escolar')).toBeTruthy();
  });
});
