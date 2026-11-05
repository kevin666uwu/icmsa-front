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
  it('muestra personal pendiente y las herramientas de estructura', async () => {
    render(<OrganizationPage access={{role:'super_admin'}} />);
    expect(await screen.findByRole('heading',{name:'Personal'})).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Agregar usuario'})).toBeNull();
    expect(within(screen.getByRole('region',{name:'Pendiente'})).getByText('Andrea Demo')).toBeTruthy();
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
  it('mueve a la persona de pendiente a su área después de asignarla', async () => {
    const assigned = { ...originalData, memberships: [{user_id:2,position_id:9}] };
    apiFetch.mockResolvedValueOnce(originalData).mockResolvedValueOnce({status:'assigned'}).mockResolvedValue(assigned);
    render(<OrganizationPage access={{role:'super_admin'}} />);
    const pending = await screen.findByRole('region',{name:'Pendiente'});
    fireEvent.click(within(pending).getByRole('button',{name:/Andrea Demo/}));
    const form = screen.getByRole('heading',{name:'Asignar persona'}).closest('form');
    fireEvent.change(within(form).getByLabelText('Puesto'),{target:{value:'9'}});
    fireEvent.click(within(form).getByRole('button',{name:'Asignar puesto'}));
    await waitFor(()=>expect(apiFetch).toHaveBeenCalledWith('/api/v1/organization/users/2/position',{
      method:'PUT',body:JSON.stringify({position_id:9})
    }));
    await waitFor(()=>expect(within(screen.getByRole('region',{name:'Con área asignada'})).getByText('Andrea Demo')).toBeTruthy());
    expect(within(screen.getByRole('region',{name:'Con área asignada'})).getByText('Control Escolar')).toBeTruthy();
    expect(within(screen.getByRole('region',{name:'Pendiente'})).queryByText('Andrea Demo')).toBeNull();
  });

});
