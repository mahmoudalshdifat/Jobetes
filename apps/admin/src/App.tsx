import { useCallback, useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import { Button, Card, EmergencyBanner, cn, ToastProvider } from '@jobetes/ui';

/**
 * System admin console — separate from the doctor portal. Audience: the
 * controller (Dr. Mahmoud) for ops actions:
 *   - manage doctor email allowlist (view-only here; mutation goes via env)
 *   - audit log inspector (recent system events)
 *   - service health overview (each edge function ping)
 *   - data-subject-rights queue (Art. 15/17 requests)
 */

type View =
  | { kind: 'mock' }
  | { kind: 'loading' }
  | { kind: 'login' }
  | { kind: 'sent' }
  | { kind: 'unauthorized' }
  | { kind: 'dashboard'; session: Session };

type ServiceStatus = { name: string; ok: boolean; latencyMs: number };
type AdminSummary = {
  intakes: number;
  appointments: number;
  recentIntakes: { id: string; createdAt: string; severity: number; locale: string }[];
} | null;

const FUNCTIONS = ['health', 'doctor-profile', 'triage'] as const;

let cached: SupabaseClient | null | undefined;
function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    cached = null;
    return cached;
  }
  cached = createClient(url, anon);
  return cached;
}

async function pingFunction(name: string): Promise<ServiceStatus> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return { name, ok: false, latencyMs: -1 };
  const start = performance.now();
  try {
    const res = await fetch(`${url}/functions/v1/${name}`, {
      method: name === 'health' || name === 'doctor-profile' ? 'GET' : 'OPTIONS',
    });
    return { name, ok: res.ok || res.status === 405, latencyMs: Math.round(performance.now() - start) };
  } catch {
    return { name, ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

/** Reset the module-level Supabase client cache — for Vitest only. */
export function _resetForTests(): void {
  cached = undefined;
}

function AdminApp(): JSX.Element {
  const supabase = getSupabase();
  const [view, setView] = useState<View>(supabase ? { kind: 'loading' } : { kind: 'mock' });
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setView(data.session ? { kind: 'dashboard', session: data.session } : { kind: 'login' });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setView(s ? { kind: 'dashboard', session: s } : { kind: 'login' });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (view.kind !== 'dashboard') return;
    void Promise.all(FUNCTIONS.map(pingFunction)).then(setStatuses);
  }, [view]);

  const loadIntakes = useCallback(async () => {
    if (!supabase || view.kind !== 'dashboard') return;
    setSummaryLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const url = import.meta.env.VITE_SUPABASE_URL;
      if (!url) return;

      // admin-summary: total count
      const summaryRes = await fetch(`${url}/functions/v1/admin-summary`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (summaryRes.ok) {
        setAdminSummary((await summaryRes.json()) as AdminSummary);
      }
    } finally {
      setSummaryLoading(false);
    }
  }, [supabase, view]);

  useEffect(() => {
    void loadIntakes();
  }, [loadIntakes]);

  return (
    <div className="min-h-screen bg-surface-warm dark:bg-ink-strong">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-b-2xl focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <EmergencyBanner message="Admin Console — internal use only · Sensitive system controls · § 203 StGB applies" />

      <header className="sticky top-0 z-40 border-b border-ink-strong/10 bg-surface-white/80 backdrop-blur dark:border-surface-white/10 dark:bg-ink-strong/80">
        <div className="container-reading flex items-center justify-between py-3">
          <span className="text-lg font-semibold tracking-tight text-brand-primary">
            Jobetes · Admin Console
          </span>
          {view.kind === 'dashboard' ? (
            <span className="text-sm text-ink-soft">{view.session.user.email}</span>
          ) : null}
        </div>
      </header>

      <main id="main-content" className="container-reading py-12 space-y-6">
        {view.kind === 'mock' ? (
          <Card title="Mock-Modus" description="Supabase env not configured.">
            <p className="text-ink-soft">
              Build with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to enable real
              auth and service-status polling.
            </p>
          </Card>
        ) : null}

        {view.kind === 'login' ? (
          <Card
            title="Admin sign-in"
            description="Magic-link sent to your verified controller email."
          >
            <form
              className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!supabase) return;
                const { error: err } = await supabase.auth.signInWithOtp({
                  email: email.trim(),
                  options: { emailRedirectTo: window.location.href },
                });
                if (err) setError(err.message);
                else setView({ kind: 'sent' });
              }}
            >
              <label className="flex-1">
                <span className="text-sm font-medium">E-Mail</span>
                <input
                  type="email"
                  required
                  className="mt-1 h-12 w-full rounded-2xl border border-ink-strong/15 bg-surface-white px-4 transition-colors hover:border-ink-strong/25 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

        {view.kind === 'sent' ? (
          <Card title="Check your inbox">
            <p>We sent a sign-in link. It expires in 60 minutes.</p>
          </Card>
        ) : null}

        {view.kind === 'dashboard' ? (
          <>
            <Card title="Service status" description="Live ping of each public edge function">
              <ul className="mt-2 grid gap-3 sm:grid-cols-3">
                {statuses.length === 0
                  ? FUNCTIONS.map((n) => (
                      <li key={n} className="flex items-center gap-2 rounded-xl border border-ink-strong/10 bg-surface-warm/40 p-3 text-sm">
                        <span className="size-2 animate-pulse rounded-full bg-brand-secondary" />
                        {n} · pinging…
                      </li>
                    ))
                  : statuses.map((s) => (
                      <li
                        key={s.name}
                        className={
                          'flex items-center justify-between rounded-xl border p-3 text-sm transition-colors ' +
                          (s.ok
                            ? 'border-accent-olive/20 bg-accent-olive/5'
                            : 'border-accent-copper/20 bg-accent-copper/5')
                        }
                      >
                        <span className="font-medium">{s.name}</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                            s.ok ? 'bg-accent-olive/15 text-accent-olive' : 'bg-accent-copper/15 text-accent-copper',
                          )}
                          aria-label={s.ok ? 'healthy' : 'unhealthy'}
                        >
                          <span className={cn('size-1.5 rounded-full', s.ok ? 'bg-accent-olive' : 'bg-accent-copper')} />
                          {s.ok ? 'ok' : 'down'} · {s.latencyMs}ms
                        </span>
                      </li>
                    ))}
              </ul>
            </Card>

            <Card
              title="Doctor allowlist"
              description="Set DOCTOR_EMAILS env in Supabase → Functions → Settings"
            >
              <p className="text-sm text-ink-soft">
                Comma-separated emails. Only allowlisted addresses can query
                /functions/v1/admin-summary even with a valid Supabase session.
              </p>
              <a
                href="https://supabase.com/dashboard/project/kzzihkwkhnnoixgogxzj/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-brand-primary underline"
              >
                Open Supabase Functions settings ↗
              </a>
            </Card>

            <Card title="Compliance shortcuts">
              <ul className="space-y-2 text-sm">
                <li>
                  <a className="text-brand-primary underline" href="https://github.com/mahmoudalshdifat/Jobetes/blob/main/compliance/RECORDS_OF_PROCESSING.md">
                    Records of Processing (Art. 30 GDPR) ↗
                  </a>
                </li>
                <li>
                  <a className="text-brand-primary underline" href="https://github.com/mahmoudalshdifat/Jobetes/blob/main/compliance/DPIA_SKELETON.md">
                    DPIA Skeleton (Art. 35) ↗
                  </a>
                </li>
                <li>
                  <a className="text-brand-primary underline" href="https://github.com/mahmoudalshdifat/Jobetes/blob/main/compliance/JORDAN_PDPL_2023_CHECKLIST.md">
                    Jordan PDPL 2023 checklist ↗
                  </a>
                </li>
              </ul>
            </Card>

            {/* Intake summary — doctor-facing queue */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                title="Intakes"
                description="Total received"
              >
                <p className="text-3xl font-semibold tabular-nums text-brand-primary">
                  {adminSummary ? adminSummary.intakes : summaryLoading ? '…' : '—'}
                </p>
              </Card>
              <Card
                title="Appointments"
                description="Pending or confirmed"
              >
                <p className="text-3xl font-semibold tabular-nums text-brand-secondary">
                  {adminSummary ? adminSummary.appointments : summaryLoading ? '…' : '—'}
                </p>
              </Card>
            </div>

            <Card
              title="Patient intake queue"
              description="Recent submissions (IDs + metadata only — no PHI displayed here)"
              footer={
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-soft/60">
                    {summaryLoading ? 'Loading…' : adminSummary ? `${adminSummary.recentIntakes.length} shown` : 'admin-summary function not yet deployed'}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => void loadIntakes()} disabled={summaryLoading}>
                    Refresh
                  </Button>
                </div>
              }
            >
              {(adminSummary?.recentIntakes ?? []).length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-ink-strong/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-warm/60 text-ink-soft">
                        <th className="px-3 py-2 text-start font-medium">ID</th>
                        <th className="px-3 py-2 text-start font-medium">Received</th>
                        <th className="px-3 py-2 text-start font-medium">Severity</th>
                        <th className="px-3 py-2 text-start font-medium">Locale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(adminSummary?.recentIntakes ?? []).map((row) => (
                        <tr key={row.id} className="border-b border-ink-strong/5 transition-colors hover:bg-surface-warm/30">
                          <td className="px-3 py-2 font-mono text-ink-soft">{row.id.slice(0, 8)}…</td>
                          <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              (row.severity ?? 0) >= 8 ? 'bg-accent-copper/15 text-accent-copper' :
                              (row.severity ?? 0) >= 5 ? 'bg-amber-100 text-amber-700' :
                              'bg-accent-olive/15 text-accent-olive'
                            )}>
                              {row.severity ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2 uppercase">{row.locale ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !summaryLoading ? (
                <p className="text-sm text-ink-soft/60">No intakes yet, or admin-summary function not deployed.</p>
              ) : null}
            </Card>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={async () => supabase?.auth.signOut()}>
                Sign out
              </Button>
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-ink-strong/10 bg-surface-white py-6 text-center text-xs text-ink-soft dark:border-surface-white/10 dark:bg-ink-strong dark:text-ink-soft">
        Jobetes · Internal Admin · § 203 StGB · GDPR Art. 9 · ISO 27001 (mapping)
      </footer>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <ToastProvider>
      <AdminApp />
    </ToastProvider>
  );
}
