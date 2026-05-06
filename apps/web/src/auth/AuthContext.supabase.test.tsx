import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('AuthProvider (configured Supabase)', () => {
  it('hydrates unauthenticated state and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe,
            },
          },
        }),
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue(undefined),
      },
    };

    vi.doMock('./supabase.js', () => ({
      getSupabase: () => mockSupabase,
    }));

    const { AuthProvider, useAuth } = await import('./AuthContext.js');

    function Probe(): JSX.Element {
      const auth = useAuth();
      return <div data-testid="status">{auth.status}</div>;
    }

    const view = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });

    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('exposes successful sendOtp and signOut', async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
        signOut: vi.fn().mockResolvedValue(undefined),
      },
    };

    vi.doMock('./supabase.js', () => ({
      getSupabase: () => mockSupabase,
    }));

    const { AuthProvider, useAuth } = await import('./AuthContext.js');

    let captured: ReturnType<typeof useAuth> | null = null;
    function Capture(): JSX.Element {
      captured = useAuth();
      return <span />;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(captured?.status).toBe('unauthenticated');
    });

    const sendResult = await captured!.sendOtp('patient@example.com');
    const verifyResult = await captured!.verifyOtp('patient@example.com', '123456');
    await captured!.signOut();

    expect(sendResult.ok).toBe(true);
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'patient@example.com',
      options: { shouldCreateUser: true },
    });
    expect(verifyResult.ok).toBe(true);
    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'patient@example.com',
      token: '123456',
      type: 'email',
    });
    expect(mockSupabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('returns error when Supabase rejects sendOtp request', async () => {
    const mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signInWithOtp: vi.fn().mockResolvedValue({ error: { message: 'Quota exceeded' } }),
        signOut: vi.fn().mockResolvedValue(undefined),
      },
    };

    vi.doMock('./supabase.js', () => ({
      getSupabase: () => mockSupabase,
    }));

    const { AuthProvider, useAuth } = await import('./AuthContext.js');

    let captured: ReturnType<typeof useAuth> | null = null;
    function Capture(): JSX.Element {
      captured = useAuth();
      return <span />;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(captured?.status).toBe('unauthenticated');
    });

    const sendResult = await captured!.sendOtp('patient@example.com');

    expect(sendResult).toEqual({ ok: false, error: 'Quota exceeded' });
  });
});
