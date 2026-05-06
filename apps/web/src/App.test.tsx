import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { App } from './App.js';
import { i18n } from './i18n.js';

let authStatus: 'authenticated' | 'unauthenticated' = 'unauthenticated';
const signOutMock = vi.fn();

vi.mock('./auth/AuthContext.js', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    session: null,
    user: null,
    status: authStatus,
    signInWithMagicLink: async () => ({ ok: true }),
    signOut: signOutMock,
  }),
}));

vi.mock('./pages/HomePage.js', () => ({
  HomePage: ({ onStartIntake }: { onStartIntake: () => void }) => (
    <section data-testid="home-page">
      <button type="button" onClick={onStartIntake}>
        Start intake from home
      </button>
    </section>
  ),
}));

vi.mock('./pages/DoctorPage.js', () => ({
  DoctorPage: () => <section data-testid="doctor-page" />,
}));

vi.mock('./pages/IntakePage.js', () => ({
  IntakePage: () => <section data-testid="intake-page" />,
}));

vi.mock('./pages/AppointmentPage.js', () => ({
  AppointmentPage: () => <section data-testid="appointment-page" />,
}));

vi.mock('./pages/LegalPage.js', () => ({
  LegalPage: () => <section data-testid="legal-page" />,
}));

vi.mock('./pages/LoginPage.js', () => ({
  LoginPage: () => <section data-testid="login-page" />,
}));

function renderApp(): void {
  render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>,
  );
}

describe('App', () => {
  beforeEach(async () => {
    authStatus = 'unauthenticated';
    signOutMock.mockReset();
    await i18n.changeLanguage('en');
  });

  it('renders brand and emergency banner', () => {
    renderApp();
    expect(screen.getAllByText(/جوبيتس|Jobetes/iu).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/911|112|Notfall|emergency|طوارئ/iu),
    ).toBeInTheDocument();
  });

  it('routes through nav buttons and home CTA', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /about the doctor/i }));
    await waitFor(() => expect(screen.getByTestId('doctor-page')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    await waitFor(() => expect(screen.getByTestId('appointment-page')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /legal/i }));
    await waitFor(() => expect(screen.getByTestId('legal-page')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /jobetes/i }));
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start intake from home/i }));
    await waitFor(() => expect(screen.getByTestId('intake-page')).toBeInTheDocument());
  });

  it('shows sign-in route in unauthenticated mode', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
  });

  it('shows sign-out action in authenticated mode', () => {
    authStatus = 'authenticated';
    renderApp();
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(signOutMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
