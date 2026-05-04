import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { _resetSupabaseClientForTests, getSupabase } from './supabase.js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

afterEach(() => {
  _resetSupabaseClientForTests();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('getSupabase', () => {
  it('returns null when env is missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const client = getSupabase();

    expect(client).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('creates and caches client when env is present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const fakeClient = { auth: {} } as unknown;
    vi.mocked(createClient).mockReturnValue(fakeClient as never);

    const first = getSupabase();
    const second = getSupabase();

    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'anon-key', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    expect(first).toBe(fakeClient);
    expect(second).toBe(fakeClient);
  });

  it('recreates client after test reset helper', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    vi.mocked(createClient)
      .mockReturnValueOnce({ id: 1 } as never)
      .mockReturnValueOnce({ id: 2 } as never);

    const beforeReset = getSupabase();
    _resetSupabaseClientForTests();
    const afterReset = getSupabase();

    expect(createClient).toHaveBeenCalledTimes(2);
    expect(beforeReset).not.toBe(afterReset);
  });
});
