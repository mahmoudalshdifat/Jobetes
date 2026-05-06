import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App.js';
import { _resetForTests } from './supabase.js';

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithOtp,
  mockFetchAdminSummary,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  mockSignInWithOtp: vi.fn(),
  mockFetchAdminSummary: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithOtp: mockSignInWithOtp,
      signOut: vi.fn().mockResolvedValue({}),
    },
  })),
}));

vi.mock('./api.js', () => ({
  fetchAdminSummary: mockFetchAdminSummary,
}));

describe('Doctor portal (mock-mode)', () => {
  it('renders mock-mode when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    _resetForTests();
    render(<App />);
    expect(screen.getByText(/Mock-Modus/u)).toBeInTheDocument();
    expect(screen.getByText(/Doctor Portal/u)).toBeInTheDocument();
  });

  it('shows the GDPR/§203 disclaimer in the footer', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    _resetForTests();
    render(<App />);
    expect(screen.getByText(/§ 203 StGB/u)).toBeInTheDocument();
    expect(screen.getAllByText(/GDPR Art\. 9/u).length).toBeGreaterThan(0);
  });
});

describe('Doctor portal (live supabase stub)', () => {
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

  it('shows unauthorized view when admin-summary returns 403', async () => {
    const fakeSession = { user: { email: 'doc@example.com' }, access_token: 'tok' };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockFetchAdminSummary.mockRejectedValue(new Error('admin-summary HTTP 403'));
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/not authorized/i)).toBeInTheDocument(),
    );
  });

  it('renders dashboard with intake and appointment counts', async () => {
    const fakeSession = { user: { email: 'doc@example.com' }, access_token: 'tok' };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });
    mockFetchAdminSummary.mockResolvedValue({
      intakes: 7,
      appointments: 3,
      recentIntakes: [],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
