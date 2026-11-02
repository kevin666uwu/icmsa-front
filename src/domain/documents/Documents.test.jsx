import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import Documents from './Documents.jsx';
vi.mock('../api.js',()=>({read:vi.fn(),write:vi.fn()}));
import { read, write } from '../api.js';
test('rejects oversized files without sending them',async()=>{
  read.mockResolvedValue({items:[]});
  render(<Documents/>);
  const file=new File([new Uint8Array(2097153)],'documento.pdf',{type:'application/pdf'});
  fireEvent.change(screen.getByLabelText(/Archivo/),{target:{files:[file]}});
  fireEvent.submit(screen.getByRole('button',{name:'Enviar documento'}).closest('form'));
  expect(await screen.findByRole('alert')).toHaveTextContent('2 MB');
  expect(write).not.toHaveBeenCalled();
});
test('shows pending official verification instead of an approval',async()=>{
  read.mockResolvedValue({items:[{id:1,kind:'curp',report:{status:'requires_review',checks:[],sha256:'a'.repeat(64),engine_version:'asidek-documents-1'}}]});
  render(<Documents admin/>);
  await waitFor(()=>expect(screen.getByText('Requiere revisión')).toBeInTheDocument());
  expect(screen.getByText(/Autenticidad oficial pendiente/)).toBeInTheDocument();
});
