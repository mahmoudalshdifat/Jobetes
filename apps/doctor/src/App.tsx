import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Button, Card, EmergencyBanner, Input, cn, ToastProvider } from '@jobetes/ui';
import { getSupabase } from './supabase.js';
import { fetchAdminSummary, fetchAppointments, updateAppointment, type AdminSummary, type Appointment } from './api.js';

type View = 'loading' | 'login' | 'sent' | 'dashboard' | 'unauthorized' | 'mock';

const VALID_VIEWS: View[] = ['loading', 'login', 'sent', 'dashboard', 'unauthorized', 'mock'];

function parseHash(): { view: View; intakeId?: string } {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [viewPart, ...rest] = raw.split('/');
  const view = VALID_VIEWS.includes(viewPart as View) ? (viewPart as View) : 'login';
  const intakeId = rest.find((s) => s.startsWith('intake-'))?.replace('intake-', '');
  return { view, intakeId };
}

function setHash(view: View, intakeId?: string): void {
  const base = view === 'login' ? '' : view;
  const suffix = intakeId ? `/intake-${intakeId}` : '';
  window.location.hash = base + suffix;
}

function DoctorApp(): JSX.Element {
  const supabase = getSupabase();
  const initial = parseHash();
  const [view, setViewState] = useState<View>(supabase ? initial.view : 'mock');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<AdminSummary['recentIntakes'][0] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  const setView = useCallback((v: View, intakeId?: string) => {
    setViewState(v);
    setHash(v, intakeId);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setViewState(parsed.view);
      if (parsed.intakeId && summary) {
        const found = summary.recentIntakes.find((i) => i.id === parsed.intakeId);
        if (found) setSelectedIntake(found);
      } else if (!parsed.intakeId) {
        setSelectedIntake(null);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [summary]);

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
  }, [supabase, setView]);

  useEffect(() => {
    if (view !== 'dashboard' || !session) return;
    fetchAdminSummary(session.access_token)
      .then((s) => setSummary(s))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'unknown';
        if (msg.includes('403') || msg.includes('401')) setView('unauthorized');
        else setError(msg);
      });
    setAppointmentsLoading(true);
    fetchAppointments(session.access_token)
      .then((res) => setAppointments(res.appointments))
      .catch(() => setAppointments([]))
      .finally(() => setAppointmentsLoading(false));
  }, [view, session]);

  return (
    <div className="min-h-screen bg-surface-warm dark:bg-ink-strong">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-b-2xl focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <EmergencyBanner message="Doctor portal — internal use only · Patient data is special-category under GDPR Art. 9." />

      <header className="sticky top-0 z-40 border-b border-ink-strong/10 bg-surface-white/80 backdrop-blur dark:border-surface-white/10 dark:bg-ink-strong/80">
        <div className="container-reading flex items-center justify-between py-3">
          <span className="text-lg font-semibold tracking-tight text-brand-primary">
            Jobetes · Doctor Portal
          </span>
          {view === 'dashboard' && session ? (
            <span className="text-sm text-ink-soft">{session.user.email}</span>
          ) : null}
        </div>
      </header>

      <main id="main-content" className="container-reading py-12">
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
                <Input
                  type="email"
                  required
                  className="mt-1"
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
                <p className="text-3xl font-semibold tabular-nums text-brand-primary">
                  {summary ? summary.intakes : '…'}
                </p>
              </Card>
              <Card title="Appointments" description="Pending or confirmed">
                <p className="text-3xl font-semibold tabular-nums text-brand-secondary">
                  {summary ? summary.appointments : '…'}
                </p>
              </Card>
            </div>

            <Card title="Recent intakes" description="Last 10, newest first — click a row to view details">
              {summary && summary.recentIntakes.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-ink-strong/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-warm/60 text-xs text-ink-soft">
                        <th className="px-3 py-2 text-start font-medium">ID</th>
                        <th className="px-3 py-2 text-start font-medium">Severity</th>
                        <th className="px-3 py-2 text-start font-medium">Locale</th>
                        <th className="px-3 py-2 text-start font-medium">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentIntakes.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => {
                            setSelectedIntake(r);
                            setHash('dashboard', r.id);
                          }}
                          className={cn(
                            'border-b border-ink-strong/5 transition-colors cursor-pointer',
                            selectedIntake?.id === r.id ? 'bg-brand-primary/5' : 'hover:bg-surface-warm/30'
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-xs text-ink-soft">{r.id.slice(0, 8)}…</td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              (r.severity ?? 0) >= 8 ? 'bg-accent-copper/15 text-accent-copper' :
                              (r.severity ?? 0) >= 5 ? 'bg-amber-100 text-amber-700' :
                              'bg-accent-olive/15 text-accent-olive'
                            )}>
                              {r.severity}/10
                            </span>
                          </td>
                          <td className="px-3 py-2 text-ink-soft">{r.locale}</td>
                          <td className="px-3 py-2 text-xs text-ink-soft">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-ink-soft">{summary ? 'No intakes yet.' : 'Loading…'}</p>
              )}
            </Card>

            {selectedIntake ? (
              <Card
                title={selectedIntake.patientName || 'Patient details'}
                description={`${selectedIntake.patientPhone}${selectedIntake.patientEmail ? ' · ' + selectedIntake.patientEmail : ''}`}
                footer={
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedIntake(null); setHash('dashboard'); }}>
                    Close details
                  </Button>
                }
              >
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Symptoms</p>
                    <p className="mt-1">
                      {Array.isArray(selectedIntake.payload.primarySymptoms)
                        ? selectedIntake.payload.primarySymptoms.join(', ')
                        : '—'}
                    </p>
                  </div>
                  {selectedIntake.payload.symptomsOtherText ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Other symptoms</p>
                      <p className="mt-1">{String(selectedIntake.payload.symptomsOtherText ?? '')}</p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Severity</p>
                      <p className="mt-1 font-semibold">{selectedIntake.severity}/10</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Duration (days)</p>
                      <p className="mt-1">{typeof selectedIntake.payload.symptomDurationDays === 'number' ? selectedIntake.payload.symptomDurationDays : '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Medications</p>
                    <p className="mt-1">
                      {Array.isArray(selectedIntake.payload.currentMedications) && selectedIntake.payload.currentMedications.length
                        ? selectedIntake.payload.currentMedications.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Allergies</p>
                    <p className="mt-1">
                      {Array.isArray(selectedIntake.payload.knownAllergies) && selectedIntake.payload.knownAllergies.length
                        ? selectedIntake.payload.knownAllergies.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Conditions</p>
                    <p className="mt-1">
                      {Array.isArray(selectedIntake.payload.knownConditions) && selectedIntake.payload.knownConditions.length
                        ? selectedIntake.payload.knownConditions.join(', ')
                        : 'None reported'}
                    </p>
                  </div>
                  {selectedIntake.payload.ramadanContext ? (
                    <p className="rounded-xl bg-brand-secondary/10 px-3 py-2 text-xs text-brand-secondary">
                      Patient noted Ramadan context / fasting
                    </p>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {/* Appointments management */}
            <Card title="Appointments" description="Manage patient appointment requests">
              {appointmentsLoading ? (
                <p className="text-ink-soft">Loading…</p>
              ) : appointments.length === 0 ? (
                <p className="text-ink-soft">No appointments yet.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-ink-strong/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-warm/60 text-xs text-ink-soft">
                        <th className="px-3 py-2 text-start font-medium">Patient</th>
                        <th className="px-3 py-2 text-start font-medium">Status</th>
                        <th className="px-3 py-2 text-start font-medium">Received</th>
                        <th className="px-3 py-2 text-end font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr key={a.id} className="border-b border-ink-strong/5">
                          <td className="px-3 py-2">
                            <p className="font-medium">{a.patientName}</p>
                            <p className="text-xs text-ink-soft">{a.phone}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                              a.status === 'confirmed' ? 'bg-accent-olive/15 text-accent-olive' :
                              a.status === 'cancelled' ? 'bg-ink-strong/10 text-ink-soft' :
                              'bg-brand-primary/10 text-brand-primary'
                            )}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-ink-soft">
                            {new Date(a.receivedAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-end">
                            <div className="flex justify-end gap-1">
                              {a.status === 'requested' ? (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (!session) return;
                                    try {
                                      await updateAppointment(session.access_token, a.id, { status: 'confirmed' });
                                      setAppointments((prev) =>
                                        prev.map((ap) => (ap.id === a.id ? { ...ap, status: 'confirmed' } : ap))
                                      );
                                    } catch (err: unknown) {
                                      setError(err instanceof Error ? err.message : 'Update failed');
                                    }
                                  }}
                                >
                                  Confirm
                                </Button>
                              ) : null}
                              {a.status !== 'cancelled' && a.status !== 'completed' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    if (!session) return;
                                    try {
                                      await updateAppointment(session.access_token, a.id, { status: 'cancelled' });
                                      setAppointments((prev) =>
                                        prev.map((ap) => (ap.id === a.id ? { ...ap, status: 'cancelled' } : ap))
                                      );
                                    } catch (err: unknown) {
                                      setError(err instanceof Error ? err.message : 'Update failed');
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {error ? (
              <p role="alert" className="rounded-2xl border border-accent-copper/20 bg-accent-copper/5 px-4 py-3 text-sm text-accent-copper">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
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

      <footer className="border-t border-ink-strong/10 bg-surface-white py-6 text-center text-xs text-ink-soft dark:border-surface-white/10 dark:bg-ink-strong dark:text-ink-soft">
        Jobetes · Internal · § 203 StGB · GDPR Art. 9
      </footer>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <ToastProvider>
      <DoctorApp />
    </ToastProvider>
  );
}
