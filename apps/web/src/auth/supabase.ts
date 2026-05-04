import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client. Returns `null` when env is not configured so the app
 * still boots in Phase-0 mock-mode (CI, dev without Supabase project).
 *
 * Never instantiated more than once — created lazily on first access.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) {
    cached = null;
    return cached;
  }
  cached = createClient(url, anon, {
    auth: {
      // Patient-friendly: prefer magic-link OTP — no password to remember.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}

/** Resets the cached client. Used by tests; not for production. */
export function _resetSupabaseClientForTests(): void {
  cached = undefined;
}
