import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Input } from '@jobetes/ui';
import { useAuth } from '../auth/AuthContext.js';

export function LoginPage({ onSuccess }: { onSuccess?: () => void }): JSX.Element {
  const { t } = useTranslation();
  const { sendOtp, verifyOtp, status } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && onSuccess) {
      const timer = setTimeout(onSuccess, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onSuccess]);

  if (status === 'authenticated') {
    return (
      <section className="container-reading py-12">
        <Card title={t('auth.welcome.title')} description={t('auth.welcome.body')} />
        <p className="mt-4 text-center text-sm text-ink-soft animate-pulse">{t('auth.redirecting')}</p>
      </section>
    );
  }

  if (step === 'otp') {
    return (
      <section className="container-reading py-12">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
        <p className="mb-6 text-ink-soft">{t('auth.login.checkEmail.body')}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const r = await verifyOtp(email, otp.trim());
            setLoading(false);
            if (!r.ok) {
              setError(r.error ?? t('auth.otp.invalid'));
            }
          }}
          className="space-y-4"
          noValidate
        >
          <Field label={t('auth.otp.label')} required error={error ?? undefined}>
            {(p) => (
              <Input
                {...p}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder={t('auth.otp.placeholder')}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="tracking-widest"
              />
            )}
          </Field>
          <Button type="submit" loading={loading} disabled={otp.length !== 6}>
            {t('auth.otp.submit')}
          </Button>
          <button
            type="button"
            className="block text-sm text-ink-soft underline underline-offset-2"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError(null);
            }}
          >
            {t('auth.otp.back')}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="container-reading py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('auth.login.subtitle')}</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          const r = await sendOtp(email.trim());
          setLoading(false);
          if (r.ok) {
            setStep('otp');
          } else {
            setError(r.error ?? 'unknown error');
          }
        }}
        className="space-y-4"
        noValidate
      >
        <Field label={t('intake.field.email')} required error={error ?? undefined}>
          {(p) => (
            <Input
              {...p}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" loading={loading} disabled={!email.includes('@')}>
          {t('auth.login.submit')}
        </Button>
      </form>
    </section>
  );
}
