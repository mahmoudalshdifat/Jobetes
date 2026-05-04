import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabase.js';

export type AuthState = {
  session: Session | null;
  user: User | null;
  status: 'loading' | 'unauthenticated' | 'authenticated' | 'mock';
};

export type AuthContextValue = AuthState & {
  signInWithMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const supabase = getSupabase();
  const [state, setState] = useState<AuthState>(() => ({
    session: null,
    user: null,
    status: supabase ? 'loading' : 'mock',
  }));

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        status: data.session ? 'authenticated' : 'unauthenticated',
      });
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    });
    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) {
        return { ok: false, error: 'Supabase not configured (Phase 0 mock mode)' };
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signInWithMagicLink, signOut }),
    [state, signInWithMagicLink, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
