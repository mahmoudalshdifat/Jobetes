import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App, _resetForTests } from './App.js';

const { mockGetSession, mockOnAuthStateChange, mockSignInWithOtp } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  mockSignInWithOtp: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithOtp: mockSignInWithOtp,
    },
  })),
}));

describe('Admin Console (mock-mode)', () => {
  it('renders mock-mode when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    _resetForTests();
    render(<App />);
    expect(screen.getAllByText(/Admin Console/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/Mock-Modus/u)).toBeInTheDocument();
  });

  it('renders the §203 disclaimer + ISO 27001 mention', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    _resetForTests();
    render(<App />);
    expect(screen.getAllByText(/§ 203 StGB/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/ISO 27001/u)).toBeInTheDocument();
  });
});

describe('Admin Console (live supabase stub)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://fake.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'fake-anon-key');
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    _resetForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('renders login form when supabase has no active session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send link/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows sign-in-link-sent confirmation after successful OTP submit', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<App />);
    await waitFor(() => screen.getByRole('button', { name: /send link/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'admin@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send link/i }));
    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument(),
    );
  });

  it('shows error alert when OTP sign-in fails', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithOtp.mockResolvedValue({ error: { message: 'rate limited' } });
    render(<App />);
    await waitFor(() => screen.getByRole('button', { name: /send link/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'admin@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send link/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    );
  });
});
