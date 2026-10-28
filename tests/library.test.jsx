import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Library from '../src/domain/student/Library.jsx';
import { visibleNavigation } from '../src/domain/navigation.js';
afterEach(() => vi.unstubAllGlobals());
it('exposes the student section and restricts administration to the server resource grant', () => {
  expect(visibleNavigation({role:'student'}).some(x=>x.path==='/portal/biblioteca')).toBe(true);
  expect(visibleNavigation({role:'employee',resources:{},permissions:[]}).some(x=>x.path==='/admin/biblioteca')).toBe(false);
});
it('renders resources, safely opens consultation links and filters by subject', async () => {
  const fetcher=vi.fn(async()=>new Response(JSON.stringify({items:[{id:1,name:'Anatomía',author:'Autor',url:'https://example.org/book',bibliography_type:'basic',subject_name:'Anatomía'}],total:1,subjects:[{id:4,name:'Anatomía'}]}),{headers:{'Content-Type':'application/json'}}));
  vi.stubGlobal('fetch',fetcher);
  render(<Library/>);
  expect(await screen.findByRole('link',{name:/Consultar recurso/})).toHaveAttribute('rel','noopener noreferrer');
  await userEvent.selectOptions(screen.getByLabelText('Materia'),'4');
  expect(fetcher.mock.calls.at(-1)[0]).toContain('subject_id=4');
});
