import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field } from '@jobetes/ui';
import { useAuth } from '../auth/AuthContext.js';

export function LoginPage(): JSX.Element {
  const { t } = useTranslation();
  const { signInWithMagicLink, status } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return (
      <section className="container-reading py-12">
        <Card title={t('auth.welcome.title')} description={t('auth.welcome.body')} />
      </section>
    );
  }

  return (
    <section className="container-reading py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('auth.login.subtitle')}</p>
      {submitted ? (
        <Card title={t('auth.login.checkEmail.title')}>
          <p>{t('auth.login.checkEmail.body')}</p>
        </Card>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const r = await signInWithMagicLink(email.trim());
            setLoading(false);
            if (r.ok) {
              setSubmitted(true);
            } else {
              setError(r.error ?? 'unknown error');
            }
          }}
          className="space-y-4"
          noValidate
        >
          <Field label={t('intake.field.email')} required error={error ?? undefined}>
            {(p) => (
              <input
                {...p}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border border-ink-strong/15 px-4"
              />
            )}
          </Field>
          <Button type="submit" loading={loading} disabled={!email.includes('@')}>
            {t('auth.login.submit')}
          </Button>
        </form>
      )}
    </section>
  );
}
