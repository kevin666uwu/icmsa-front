import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App.jsx';
import { saveSession } from '../src/lib/session.js';
beforeEach(()=>{
 vi.stubGlobal('requestAnimationFrame',vi.fn());
 vi.stubGlobal('scrollTo',vi.fn());
});
afterEach(()=>vi.unstubAllGlobals());
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
it.each(['/portal','/portal/biblioteca','/admin/usuarios'])('redirects unauthenticated %s to the single login route',async path=>{
 window.history.replaceState({},'',path);
 const replace=vi.spyOn(window.history,'replaceState');
 vi.stubGlobal('fetch',vi.fn(async()=>response({public_registration_enabled:false})));
 render(<App/>);
 expect(await screen.findByRole('heading',{name:'Iniciar sesión'})).toBeInTheDocument();
 expect(window.location.pathname).toBe('/login');
 expect(replace).toHaveBeenCalledWith({},'', '/login');
 expect(screen.getAllByLabelText('Correo')).toHaveLength(1);
 expect(document.querySelector('.login-shell')).toBeInTheDocument();
 expect(document.querySelector('.institutional-header')).toBeNull();
 expect(document.querySelector('.login-shell').firstElementChild).toHaveClass('login-form-panel');
 replace.mockRestore();
});
it('redirects an expired portal session to login',async()=>{
 window.history.replaceState({},'','/portal');saveSession('expired');
 vi.stubGlobal('fetch',vi.fn(async url=>String(url).endsWith('/auth/me')?response({detail:'Sesión vencida'},401):response({public_registration_enabled:false})));
 render(<App/>);
 await screen.findByRole('heading',{name:'Iniciar sesión'});
 expect(window.location.pathname).toBe('/login');
});
it('keeps the public homepage accessible without redirecting to login',async()=>{
 window.history.replaceState({},'','/');render(<App/>);
 await screen.findByRole('heading',{name:'Formamos a quienes cuidarán el futuro de la salud.'});
 expect(window.location.pathname).toBe('/');
 expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
});
it('sends an authenticated user from login to the portal without rendering another login',async()=>{
 window.history.replaceState({},'','/login');saveSession('verified');
 vi.stubGlobal('fetch',vi.fn(async url=>String(url).endsWith('/auth/me')?response({id:1,name:'Alumno',role:'student',active:true}):String(url).endsWith('/access')?response({role:'student',permissions:[],resources:{}}):response({detail:'Expediente pendiente'},404)));
 render(<App/>);
 await waitFor(()=>expect(window.location.pathname).toBe('/portal'));
 expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
});
