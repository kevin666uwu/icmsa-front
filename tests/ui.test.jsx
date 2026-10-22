import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../src/components/ui/Modal.jsx';
import { Input, Tabs } from '../src/components/ui/Primitives.jsx';
import { canAccessRoute } from '../src/app/router/navigation.js';
import { useRemote } from '../src/hooks/useRemote.js';
import App from '../src/App.jsx';
import { saveSession } from '../src/lib/session.js';
import { afterEach } from 'vitest';
afterEach(() => vi.unstubAllGlobals());
describe('Accessible UI and protected routes', () => {
  it('associates labels with inputs', async () => {
    render(<Input label="Correo" type="email" />);
    await userEvent.type(screen.getByLabelText('Correo'), 'user@example.com');
    expect(screen.getByRole('textbox')).toHaveValue('user@example.com');
  });
  it('supports keyboard tabs and correct panel semantics', async () => {
    render(<Tabs items={[{ label: 'Uno', content: 'Primero' }, { label: 'Dos', content: 'Segundo' }]} />);
    screen.getByRole('tab', { name: 'Uno' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Segundo');
    await userEvent.keyboard('{Home}'); expect(screen.getByRole('tabpanel')).toHaveTextContent('Primero');
  });
  it('labels the modal, handles cancel and restores focus', () => {
    const opener = document.createElement('button');document.body.append(opener);opener.focus();
    const close = vi.fn(); const view = render(<Modal title="Detalle" onClose={close}>Content</Modal>);
    fireEvent(screen.getByRole('dialog', { name: 'Detalle' }), new Event('cancel', { bubbles: true }));
    expect(close).toHaveBeenCalledOnce();view.unmount();expect(opener).toHaveFocus();opener.remove();
  });
  it('enforces generic roles and active state', () => {
    expect(canAccessRoute('/portal', null)).toBe(false);
    expect(canAccessRoute('/portal', { active: true, role: 'employee' })).toBe(true);
    expect(canAccessRoute('/admin', { active: true, role: 'employee' })).toBe(false);
    expect(canAccessRoute('/admin', { active: true, role: 'super_admin' })).toBe(true);
    expect(canAccessRoute('/admin', { active: false, role: 'super_admin' })).toBe(false);
  });
  it('does not trust a cached token before server verification', async () => {
    window.history.replaceState({}, '', '/admin');saveSession('unverified');
    let resolve;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(done => { resolve = done; })));
    render(<App />);
    expect(screen.getByText('Comprobando sesión…')).toBeInTheDocument();
    expect(screen.queryByText('Administración de usuarios')).not.toBeInTheDocument();
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    resolve(new Response(JSON.stringify({ id: 1, role: 'employee', active: true }), { headers: { 'Content-Type': 'application/json' } }));
    expect(await screen.findByText('No tienes permisos para acceder a esta sección.')).toBeInTheDocument();
  });
  it('cancels stale loads so old results cannot replace new ones', async () => {
    let resolveOld;let oldSignal;
    const oldLoader = vi.fn(signal => { oldSignal = signal;return new Promise(resolve => { resolveOld = resolve; }); });
    const newLoader = vi.fn(async () => 'new');
    function Probe({ loader }) { const state = useRemote(loader);return <p>{state.data || 'loading'}</p>; }
    const view = render(<Probe loader={oldLoader} />);
    await waitFor(() => expect(oldLoader).toHaveBeenCalledOnce());
    view.rerender(<Probe loader={newLoader} />);
    expect(await screen.findByText('new')).toBeInTheDocument();
    expect(oldSignal.aborted).toBe(true);resolveOld('old');
    await waitFor(() => expect(screen.getByText('new')).toBeInTheDocument());
  });
});
