import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Button, Card, EmergencyBanner } from '@jobetes/ui';
import { getSupabase } from './supabase.js';
import { fetchAdminSummary, type AdminSummary } from './api.js';

type View = 'loading' | 'login' | 'sent' | 'dashboard' | 'unauthorized' | 'mock';

export function App(): JSX.Element {
  const supabase = getSupabase();
  const [view, setView] = useState<View>(supabase ? 'loading' : 'mock');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setSession(data.session);
        setView('dashboard');
      } else {
        setView('login');
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setView(s ? 'dashboard' : 'login');
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (view !== 'dashboard' || !session) return;
    fetchAdminSummary(session.access_token)
      .then((s) => setSummary(s))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'unknown';
        if (msg.includes('403') || msg.includes('401')) setView('unauthorized');
        else setError(msg);
      });
  }, [view, session]);

  return (
    <div className="min-h-screen">
      <EmergencyBanner message="Doctor portal — internal use only · Patient data is special-category under GDPR Art. 9." />

      <header className="border-b border-ink-strong/10 bg-surface-white">
        <div className="container-reading flex items-center justify-between py-4">
          <span className="text-lg font-semibold tracking-tight text-brand-primary">
            Jobetes · Doctor Portal
          </span>
          {view === 'dashboard' && session ? (
            <span className="text-sm text-ink-soft">{session.user.email}</span>
          ) : null}
        </div>
      </header>

      <main className="container-reading py-12">
        {view === 'loading' ? <p className="text-ink-soft">Lade…</p> : null}

        {view === 'mock' ? (
          <Card title="Mock-Modus" description="VITE_SUPABASE_URL ist nicht gesetzt.">
            <p className="text-ink-soft">
              Diese Ansicht läuft im Offline-Mock — sobald Sie die Supabase-Env-Variablen
              im Build setzen, sehen Sie die echten Patientenanfragen.
            </p>
          </Card>
        ) : null}

        {view === 'login' ? (
          <Card title="Sign in" description="Magic-link to your verified doctor email.">
            <form
              className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!supabase) return;
                const { error: signErr } = await supabase.auth.signInWithOtp({
                  email: email.trim(),
                  options: { emailRedirectTo: window.location.href },
                });
                if (signErr) setError(signErr.message);
                else setView('sent');
              }}
            >
              <label className="flex-1">
                <span className="text-sm font-medium">E-Mail</span>
                <input
                  type="email"
                  required
                  className="mt-1 h-12 w-full rounded-2xl border border-ink-strong/15 px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <Button type="submit" disabled={!email.includes('@')}>
                Send link
              </Button>
            </form>
            {error ? (
              <p role="alert" className="mt-2 text-sm text-accent-copper">
                {error}
              </p>
            ) : null}
          </Card>
        ) : null}

        {view === 'sent' ? (
          <Card title="Check your inbox">
            <p>We sent a sign-in link. It expires in 60 minutes.</p>
          </Card>
        ) : null}

        {view === 'unauthorized' ? (
          <Card title="Not authorized">
            <p className="mb-4 text-ink-soft">
              Your email is not in the doctor allowlist. Ask the controller to add it.
            </p>
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase?.auth.signOut();
              }}
            >
              Sign out
            </Button>
          </Card>
        ) : null}

        {view === 'dashboard' && session ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Intakes" description="Total received">
                <p className="text-3xl font-semibold tabular-nums">
                  {summary ? summary.intakes : '…'}
                </p>
              </Card>
              <Card title="Appointments" description="Pending or confirmed">
                <p className="text-3xl font-semibold tabular-nums">
                  {summary ? summary.appointments : '…'}
                </p>
              </Card>
            </div>

            <Card title="Recent intakes" description="Last 10, newest first">
              {summary && summary.recentIntakes.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {summary.recentIntakes.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-ink-strong/10 p-3"
                    >
                      <span className="font-mono text-xs text-ink-soft">{r.id.slice(0, 8)}</span>
                      <span>severity {r.severity}/10</span>
                      <span className="text-ink-soft">{r.locale}</span>
                      <time className="text-xs text-ink-soft">
                        {new Date(r.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-soft">{summary ? 'No intakes yet.' : 'Loading…'}</p>
              )}
            </Card>

            {error ? (
              <p role="alert" className="text-accent-copper">
                {error}
              </p>
            ) : null}

            <div>
              <Button
                variant="ghost"
                onClick={async () => {
                  await supabase?.auth.signOut();
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-ink-strong/10 bg-surface-white py-6 text-center text-xs text-ink-soft">
        Jobetes · Internal · § 203 StGB · GDPR Art. 9
      </footer>
    </div>
  );
}
