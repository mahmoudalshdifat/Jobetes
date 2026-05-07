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

  it('shows "No intakes yet." empty-state when recentIntakes is empty but loaded', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: 'd@x' }, access_token: 't' } },
    });
    mockFetchAdminSummary.mockResolvedValue({
      intakes: 0,
      appointments: 0,
      recentIntakes: [],
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText(/No intakes yet/iu)).toBeInTheDocument());
  });

  it('renders the recent-intakes table with severity badge colour-coded by tier', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: 'd@x' }, access_token: 't' } },
    });
    mockFetchAdminSummary.mockResolvedValue({
      intakes: 3,
      appointments: 0,
      recentIntakes: [
        { id: 'aaaaaaaa-bbbb', createdAt: '2026-05-04T10:00:00Z', severity: 9, locale: 'ar' },
        { id: 'cccccccc-dddd', createdAt: '2026-05-04T11:00:00Z', severity: 6, locale: 'de' },
        { id: 'eeeeeeee-ffff', createdAt: '2026-05-04T12:00:00Z', severity: 2, locale: 'en' },
      ],
    });
    render(<App />);

    // Header columns
    await waitFor(() => expect(screen.getByText('ID')).toBeInTheDocument());
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Locale')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();

    // 3 data rows + 1 header row
    expect(screen.getAllByRole('row')).toHaveLength(4);

    // Severity badges — one per tier
    const sev9 = screen.getByText('9/10');
    const sev6 = screen.getByText('6/10');
    const sev2 = screen.getByText('2/10');
    expect(sev9.className).toMatch(/copper/); // critical tier
    expect(sev6.className).toMatch(/amber/); // mid tier
    expect(sev2.className).toMatch(/olive/); // low tier

    // ID truncated to first 8 chars + ellipsis
    expect(screen.getByText('aaaaaaaa…')).toBeInTheDocument();

    // Locale codes
    expect(screen.getByText('ar')).toBeInTheDocument();
    expect(screen.getByText('de')).toBeInTheDocument();
    expect(screen.getByText('en')).toBeInTheDocument();
  });

  it('shows generic error message when fetchAdminSummary fails with non-auth status', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: 'd@x' }, access_token: 't' } },
    });
    mockFetchAdminSummary.mockRejectedValue(new Error('admin-summary HTTP 500'));
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/500/),
    );
    // It should NOT bounce to the unauthorized view (only 401/403 do that)
    expect(screen.queryByText(/not authorized/iu)).toBeNull();
  });
});
