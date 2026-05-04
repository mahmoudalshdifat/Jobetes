import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { LoginPage } from './LoginPage.js';
import { i18n } from '../i18n.js';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'mock';
let authStatus: AuthStatus = 'unauthenticated';
const signInWithMagicLinkMock = vi.fn();

vi.mock('../auth/AuthContext.js', () => ({
  useAuth: () => ({
    session: null,
    user: null,
    status: authStatus,
    signInWithMagicLink: signInWithMagicLinkMock,
    signOut: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(async () => {
    authStatus = 'unauthenticated';
    signInWithMagicLinkMock.mockReset();
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

  it('submits magic link and shows check-email state on success', async () => {
    signInWithMagicLinkMock.mockResolvedValue({ ok: true });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a link/i }));

    await waitFor(() => {
      expect(signInWithMagicLinkMock).toHaveBeenCalledWith('user@example.com');
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('shows API error when magic-link request fails', async () => {
    signInWithMagicLinkMock.mockResolvedValue({ ok: false, error: 'Mailbox rejected' });

    render(
      <I18nextProvider i18n={i18n}>
        <LoginPage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send me a link/i }));

    await waitFor(() => {
      expect(screen.getByText(/mailbox rejected/i)).toBeInTheDocument();
    });
  });
});
