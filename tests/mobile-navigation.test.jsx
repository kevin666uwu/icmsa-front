import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicSite from '../src/domain/PublicSite.jsx';
import StudentPortal from '../src/domain/student/StudentPortal.jsx';
import Portal from '../src/domain/Portal.jsx';
vi.mock('../src/app/router/navigation.js',()=>({navigate:vi.fn()}));
afterEach(()=>vi.unstubAllGlobals());
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const studentData={student:{student_number:'TEST'},program:null,summary:{career_progress:0,active_classes:0,balance:0,open_requests:0},classes:[],teachers:[],finance:{entries:[]},services:{school_requests:[],student_cases:[]}};
it('provides a public menu that closes after choosing a destination and with Escape',async()=>{
 render(<PublicSite/>);
 const toggle=screen.getByRole('button',{name:'Menú'});
 expect(toggle).toHaveAttribute('aria-expanded','false');
 await userEvent.click(toggle);
 expect(toggle).toHaveAttribute('aria-expanded','true');
 await userEvent.click(within(screen.getByRole('navigation')).getByRole('link',{name:'Programas'}));
 expect(toggle).toHaveAttribute('aria-expanded','false');
 await userEvent.click(toggle);
 await userEvent.keyboard('{Escape}');
 expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(toggle).toHaveFocus();
});
it('keeps every student destination and sign out available inside the compact menu',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>response(studentData)));
 const signOut=vi.fn(async()=>{});
 render(<StudentPortal user={{name:'Alumno de prueba'}} session={{signOut}} path="/portal"/>);
 await screen.findByText('Hola, Alumno.');
 const toggle=screen.getByRole('button',{name:'Menú'});
 await userEvent.click(toggle);
 const nav=screen.getByRole('navigation',{name:'Navegación del alumno'});
 for(const name of ['Inicio','Aula virtual','Mi avance','Mi carrera','Profesores','Biblioteca digital','Pagos','Trámites','Documentos']){
  expect(within(nav).getByRole('link',{name})).toBeInTheDocument();
 }
 expect(toggle).toHaveAttribute('aria-expanded','true');
 await userEvent.click(within(nav).getByRole('button',{name:'Cerrar sesión'}));
 expect(signOut).toHaveBeenCalledOnce();
});
it('opens admin navigation in a focusable dialog and restores scrolling when closed',async()=>{
 vi.stubGlobal('fetch',vi.fn(async url=>response(String(url).includes('/access')?{role:'super_admin',permissions:['users.read'],resources:{}}:{roles:[]})));
 render(<Portal path="/unavailable" session={{user:{name:'Administrador'}}}/>);
 const toggle=await screen.findByRole('button',{name:/Menú/});
 await userEvent.click(toggle);
 expect(screen.getByRole('dialog',{name:'Menú institucional'})).toBeInTheDocument();
 expect(document.body.style.overflow).toBe('hidden');
 await userEvent.click(screen.getByRole('button',{name:'Cerrar diálogo'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(document.body.style.overflow).not.toBe('hidden');
 expect(toggle).toHaveFocus();
});
