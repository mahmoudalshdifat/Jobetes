import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { LoginPage } from './LoginPage.js';
import { i18n } from '../i18n.js';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'mock';
let authStatus: AuthStatus = 'unauthenticated';
const sendOtpMock = vi.fn();
const verifyOtpMock = vi.fn();

vi.mock('../auth/AuthContext.js', () => ({
  useAuth: () => ({
    session: null,
    user: null,
    status: authStatus,
    sendOtp: sendOtpMock,
    verifyOtp: verifyOtpMock,
    signOut: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(async () => {
    authStatus = 'unauthenticated';
    sendOtpMock.mockReset();
    verifyOtpMock.mockReset();
    await i18n.changeLanguage('en');
  });

  it('shows welcome card when user is already authenticated', () => {
    authStatus = 'authenticated';

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    expect(screen.getByText(/you are signed in/i)).toBeInTheDocument();
  });

  it('sends OTP and advances to code-entry step on success', async () => {
    sendOtpMock.mockResolvedValue({ ok: true });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await waitFor(() => {
      expect(sendOtpMock).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByLabelText(/one-time code/i)).toBeInTheDocument();
    });
  });

  it('shows API error when OTP send fails', async () => {
    sendOtpMock.mockResolvedValue({ ok: false, error: 'Mailbox rejected' });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await waitFor(() => {
      expect(screen.getByText(/mailbox rejected/i)).toBeInTheDocument();
    });
  });

  it('verifies OTP code and signs in on success', async () => {
    sendOtpMock.mockResolvedValue({ ok: true });
    verifyOtpMock.mockResolvedValue({ ok: true });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    // Step 1: send code
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await waitFor(() => expect(screen.getByLabelText(/one-time code/i)).toBeInTheDocument());

    // Step 2: enter code
    fireEvent.change(screen.getByLabelText(/one-time code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith('user@example.com', '123456');
    });
  });

  it('shows error when OTP code is invalid', async () => {
    sendOtpMock.mockResolvedValue({ ok: true });
    verifyOtpMock.mockResolvedValue({ ok: false, error: 'Token has expired or is invalid' });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await waitFor(() => expect(screen.getByLabelText(/one-time code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/one-time code/i), { target: { value: '999999' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/token has expired or is invalid/i)).toBeInTheDocument();
    });
  });

  it('goes back to email step when "Use a different email" is clicked', async () => {
    sendOtpMock.mockResolvedValue({ ok: true });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a code/i }));

    await waitFor(() => expect(screen.getByLabelText(/one-time code/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /use a different email/i }));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByLabelText(/one-time code/i)).not.toBeInTheDocument();
  });
});
