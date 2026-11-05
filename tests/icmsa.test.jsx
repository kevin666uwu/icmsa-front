import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { visibleNavigation } from '../src/domain/navigation.js';
import { moveProcess } from '../src/domain/organization/processBoard.js';
import ProcessBoard from '../src/domain/organization/ProcessBoard.jsx';
import ResourcePage from '../src/domain/ResourcePage.jsx';
import ResourceForm from '../src/domain/ResourceForm.jsx';
import Portal from '../src/domain/Portal.jsx';
afterEach(()=>vi.unstubAllGlobals());
const spec={title:'Departamentos',path:'/departments',permission:'organization',fields:{name:{label:'Nombre',type:'text',required:true},active:{label:'Activo',type:'boolean',required:true,default:true}}};
const access={permissions:['organization.read','organization.write'],resources:{departments:spec}};
const data={departments:[{id:1,name:'Dirección'}],areas:[{id:2,name:'Área',department_id:1}],positions:[{id:3,name:'Docente',area_id:2,parent_position_id:null},{id:4,name:'Docente',area_id:2,parent_position_id:3}],employees:[{id:5,first_name:'Persona',last_name:'Prueba',status:'active'}],memberships:[{employee_id:5,position_id:3,active:true,is_primary:true}],process_overview:{}};
const response=payload=>new Response(JSON.stringify(payload),{headers:{'Content-Type':'application/json'}});
describe('ICMSA institutional domain',()=>{
  it('only exposes navigation authorized by server contracts',()=>{
    const items=visibleNavigation(access);
    expect(items.map(i=>i.label)).toEqual(['Organigrama']);
    expect(items.some(i=>i.resource==='students')).toBe(false);
    expect(items.some(i=>i.type==='users')).toBe(false);
  });
  it('keeps process lanes exclusive and supports keyboard alternative',async()=>{
    const save=vi.fn();
    render(<ProcessBoard processes={[{id:1,name:'Proceso de prueba'}]} initial={{responsible_ids:[],related_ids:[]}} onSave={save}/>);
    await userEvent.selectOptions(screen.getByLabelText('Mover Proceso de prueba'),'responsible');
    expect(within(screen.getByRole('region',{name:'Procesos responsables'})).getByText('Proceso de prueba')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button',{name:'Guardar asignaciones'}));
    expect(save).toHaveBeenCalledWith({responsible_ids:[1],related_ids:[]});
    expect(moveProcess({responsible_ids:[1],related_ids:[]},1,'related')).toEqual({responsible_ids:[],related_ids:[1]});
  });
  it('supports drag and drop but ignores unknown process IDs',()=>{
    render(<ProcessBoard processes={[{id:1,name:'Proceso'}]} initial={{responsible_ids:[],related_ids:[]}} onSave={vi.fn()}/>);
    const lane=screen.getByRole('region',{name:'Procesos relacionados'});
    fireEvent.drop(lane,{dataTransfer:{getData:()=> '1'}});
    expect(within(lane).getByText('Proceso')).toBeInTheDocument();
    fireEvent.drop(screen.getByRole('region',{name:'Procesos responsables'}),{dataTransfer:{getData:()=> '999'}});
    expect(within(lane).getByText('Proceso')).toBeInTheDocument();
  });
  it('shows complete empty state and authorized creation action',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response({items:[],total:0,offset:0,limit:25})));
    render(<ResourcePage name="departments" spec={spec} access={access}/>);
    expect(await screen.findByText('Sin registros disponibles')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Crear primer registro'})).toBeInTheDocument();
  });
  it('validates and submits field contracts without duplicate requests',async()=>{
    const saved=vi.fn(),fetcher=vi.fn(async()=>response({id:1}));
    vi.stubGlobal('fetch',fetcher);
    render(<ResourceForm spec={spec} access={access} record={null} onClose={vi.fn()} onSaved={saved}/>);
    await userEvent.type(await screen.findByLabelText(/Nombre/),'Departamento de prueba');
    await userEvent.click(screen.getByRole('button',{name:'Guardar'}));
    await waitFor(()=>expect(saved).toHaveBeenCalledOnce());
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({name:'Departamento de prueba',active:true});
  });
  it('shows actionable loading and network errors',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline');}));
    render(<ResourcePage name="departments" spec={spec} access={access}/>);
    expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Reintentar'})).toBeInTheDocument();
  });
  it('denies direct portal routes absent from server permissions',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response({permissions:[],resources:{}})));
    render(<Portal path="/portal/alumnos" session={{user:{id:1,name:'Prueba',active:true}}}/>);
    expect(await screen.findByText('Esta página no está disponible para tu cuenta.')).toBeInTheDocument();
    expect(screen.queryByRole('link',{name:'Alumnos'})).not.toBeInTheDocument();
  });
});

