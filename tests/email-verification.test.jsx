import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmailVerificationForm from '../src/features/account/EmailVerificationForm.jsx';
import LoginPage from '../src/features/account/LoginPage.jsx';
import * as service from '../src/services/emailVerification.service.js';
vi.mock('../src/services/emailVerification.service.js', () => ({
  verificationStatus: vi.fn(), requestVerification: vi.fn(), verifyEmailCode: vi.fn(),
}));
const session = () => ({ user: { id: 1, role: 'employee', active: true }, refresh: vi.fn().mockResolvedValue({}) });
afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); vi.unstubAllGlobals(); });
describe('Email verification', () => {
  it('loads status, exposes accessible numeric OTP, succeeds and continues', async () => {
    service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 0, delivery_status: 'sent' });
    service.verifyEmailCode.mockResolvedValue({ email_verified: true });
    const account = session();
    render(<EmailVerificationForm session={account} />);
    expect(screen.getByRole('status', { name: 'Comprobando verificación…' })).toBeInTheDocument();
    const input = await screen.findByLabelText('Código de verificación');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    fireEvent.change(input, { target: { value: '012345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }));
    expect(await screen.findByText('Correo verificado.')).toBeInTheDocument();
    expect(service.verifyEmailCode).toHaveBeenCalledWith('012345', expect.any(AbortSignal));
    expect(account.refresh).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(window.location.pathname).toBe('/portal');
  });
  it('honors cooldown and no duplicate send while busy', async () => {
    service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 60, delivery_status: 'sent' });
    render(<EmailVerificationForm session={session()} />);
    expect(await screen.findByRole('button', { name: /Reenviar código en/ })).toBeDisabled();
    expect(service.requestVerification).not.toHaveBeenCalled();
  });
  it('resends once, clears old code and shows backend cooldown', async () => {
    service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 0, delivery_status: 'not_requested' });
    let resolve;
    service.requestVerification.mockImplementation(() => new Promise(done => { resolve = done; }));
    render(<EmailVerificationForm session={session()} />);
    const send = await screen.findByRole('button', { name: 'Solicitar código' });
    fireEvent.click(send); fireEvent.click(send);
    expect(service.requestVerification).toHaveBeenCalledOnce();
    expect(send).toBeDisabled();
    await act(async () => resolve({ email_verified: false, retry_after_seconds: 60, delivery_status: 'sent' }));
    expect(screen.getByRole('button', { name: /Reenviar código en/ })).toBeDisabled();
    expect(screen.getByText('Enviamos un código de 6 dígitos a tu correo.')).toBeInTheDocument();
  });
  it('shows neutral error and does not claim success', async () => {
    service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 0, delivery_status: 'sent' });
    service.verifyEmailCode.mockRejectedValue(new Error('Código incorrecto o vencido.'));
    render(<EmailVerificationForm session={session()} />);
    fireEvent.change(await screen.findByLabelText('Código de verificación'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar correo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Código incorrecto o vencido.');
    expect(screen.queryByText('Correo verificado.')).not.toBeInTheDocument();
  });
  it('aborts pending requests on unmount', async () => {
    service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 0, delivery_status: 'sent' });
    service.requestVerification.mockImplementation(() => new Promise(() => {}));
    const view = render(<EmailVerificationForm session={session()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Reenviar código' }));
    const signal = service.requestVerification.mock.calls[0][0];
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
  it('registration confirmation and redirect use server verification flag', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ public_registration_enabled: true }), { headers: { 'Content-Type': 'application/json' } })));
    const account = { signUp: vi.fn().mockResolvedValue({ role: 'employee', email_verification_enabled: true, email_verified: false }) };
    render(<LoginPage session={account} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Crear cuenta' }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Member' } });
    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'long-password-123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'long-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() => expect(window.location.pathname).toBe('/verify-email'));
    expect(account.signUp).toHaveBeenCalledOnce();
  });
});

it('does not duplicate verification submissions', async () => {
  service.verificationStatus.mockResolvedValue({ email_verified: false, retry_after_seconds: 0, delivery_status: 'sent' });
  service.verifyEmailCode.mockImplementation(() => new Promise(() => {}));
  render(<EmailVerificationForm session={session()} />);
  const input = await screen.findByLabelText('Código de verificación');
  fireEvent.change(input, { target: { value: '123456' } });
  fireEvent.submit(input.closest('form'));
  fireEvent.submit(input.closest('form'));
  expect(service.verifyEmailCode).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled();
});

