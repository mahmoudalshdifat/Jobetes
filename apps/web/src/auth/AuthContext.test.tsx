import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext.js';
import { _resetSupabaseClientForTests } from './supabase.js';

afterEach(() => {
  _resetSupabaseClientForTests();
  vi.unstubAllEnvs();
});

function Probe(): JSX.Element {
  const { status } = useAuth();
  return <div data-testid="status">{status}</div>;
}

describe('AuthProvider', () => {
  it('falls back to "mock" status when Supabase env is missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('status').textContent).toBe('mock');
  });

  it('sendOtp fails gracefully in mock mode', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
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
    expect(captured).not.toBeNull();
    const result = await captured!.sendOtp('test@example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mock|not configured/iu);
  });

  it('verifyOtp fails gracefully in mock mode', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
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
    expect(captured).not.toBeNull();
    const result = await captured!.verifyOtp('test@example.com', '123456');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mock|not configured/iu);
  });
});
