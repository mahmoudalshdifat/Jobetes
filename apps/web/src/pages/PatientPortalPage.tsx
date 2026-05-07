import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Input, Skeleton, cn } from '@jobetes/ui';
import { useAuth } from '../auth/AuthContext.js';
import { JobetesApiClient } from '../lib/api-client.js';

export function PatientPortalPage(): JSX.Element {
  const { t } = useTranslation();
  const { user, signOut, status } = useAuth();
  const [intakes, setIntakes] = useState<{ id: string; receivedAt: string }[]>([]);
  const [intakesLoading, setIntakesLoading] = useState(true);
  const [intakesError, setIntakesError] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<{
    id: string;
    receivedAt: string;
    status: string;
    reason: string;
    scheduledAt?: string;
  }[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const api = new JobetesApiClient({
    transport: 'fastify',
    getToken: async () => {
      const supabase = (await import('../auth/supabase.js')).getSupabase();
      const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
      return data.session?.access_token ?? null;
    },
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    setIntakesLoading(true);
    api
      .myIntakes()
      .then((res) => setIntakes(res.intakes))
      .catch((err: unknown) => {
        setIntakesError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setIntakesLoading(false));

    setAppointmentsLoading(true);
    api
      .myAppointments()
      .then((res) => setAppointments(res.appointments))
      .catch(() => setAppointments([]))
      .finally(() => setAppointmentsLoading(false));
  }, [status]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimLoading(true);
    setClaimSuccess(false);
    setClaimError(null);
    try {
      await api.claimByPhone(phone.trim());
      setClaimSuccess(true);
      setPhone('');
      // Refresh intakes after successful claim
      const res = await api.myIntakes();
      setIntakes(res.intakes);
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : String(err));
    } finally {
      setClaimLoading(false);
    }
  };

  if (status === 'unauthenticated' || status === 'mock') {
    return (
      <section className="container-reading py-12">
        <Card
          title={t('auth.login.title')}
          description={t('auth.login.subtitle')}
        />
      </section>
    );
  }

  return (
    <section className="container-reading py-12 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('portal.heading')}</h1>

      {user?.email ? (
        <p className="text-ink-soft">{user.email}</p>
      ) : null}

      {/* Intakes */}
      <Card title={t('portal.intakes')}>
        {intakesLoading ? (
          <div className="space-y-3">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ) : intakesError ? (
          <p role="alert" className="text-sm text-accent-copper">{intakesError}</p>
        ) : intakes.length === 0 ? (
          <p className="text-ink-soft">{t('portal.noIntakes')}</p>
        ) : (
          <ul className="space-y-2">
            {intakes.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-xl border border-ink-strong/10 bg-surface-white px-4 py-3"
              >
                <span className="font-mono text-sm text-ink-soft">{i.id.slice(0, 8)}…</span>
                <span className="text-sm text-ink-soft">
                  {new Date(i.receivedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Appointments */}
      <Card title={t('nav.appointment')}>
        {appointmentsLoading ? (
          <div className="space-y-3">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-ink-soft">No appointments yet.</p>
        ) : (
          <ul className="space-y-2">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-ink-strong/10 bg-surface-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{a.reason}</p>
                  <p className="text-xs text-ink-soft">{new Date(a.receivedAt).toLocaleString()}</p>
                </div>
                <span className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  a.status === 'confirmed' ? 'bg-accent-olive/15 text-accent-olive' :
                  a.status === 'cancelled' ? 'bg-ink-strong/10 text-ink-soft' :
                  'bg-brand-primary/10 text-brand-primary'
                )}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Claim by phone */}
      <Card
        title={t('portal.claim.title')}
        description={t('portal.claim.description')}
      >
        <form onSubmit={handleClaim} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t('intake.field.phone')} className="flex-1">
            {(p) => (
              <Input
                {...p}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+962…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit" loading={claimLoading} disabled={!phone.trim()}>
            {t('portal.claim.button')}
          </Button>
        </form>
        {claimSuccess ? (
          <p role="status" className="mt-2 text-sm text-accent-olive">{t('portal.claim.success')}</p>
        ) : null}
        {claimError ? (
          <p role="alert" className="mt-2 text-sm text-accent-copper">{claimError}</p>
        ) : null}
      </Card>

      {/* Data Subject Rights */}
      <Card title="Your data" description="GDPR rights: export, rectification, erasure">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            loading={exportLoading}
            onClick={async () => {
              setExportLoading(true);
              try {
                const data = await api.exportMyData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'jobetes-export.json';
                a.click();
                URL.revokeObjectURL(url);
              } catch (err: unknown) {
                setClaimError(err instanceof Error ? err.message : 'Export failed');
              } finally {
                setExportLoading(false);
              }
            }}
          >
            Export my data
          </Button>
          {!deleteConfirm ? (
            <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(true)}>
              Delete my account
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-accent-copper">Are you sure? This cannot be undone.</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    await api.deleteMyAccount();
                    await signOut();
                  } catch (err: unknown) {
                    setClaimError(err instanceof Error ? err.message : 'Delete failed');
                    setDeleteLoading(false);
                  }
                }}
              >
                Confirm delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => void signOut()}>
          {t('portal.signOut')}
        </Button>
      </div>
    </section>
  );
}
