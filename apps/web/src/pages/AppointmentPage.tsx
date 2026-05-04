import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field } from '@jobetes/ui';
import {
  AppointmentRequestSchema,
  type AppointmentRequest,
  type Locale,
} from '@jobetes/shared-schemas';

export function AppointmentPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<AppointmentRequest>({
    resolver: zodResolver(AppointmentRequestSchema),
    defaultValues: {
      preferredLocale: (i18n.resolvedLanguage ?? 'ar') as Locale,
      preferredWindow: 'any',
      preferredDates: [],
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setServerError(`HTTP ${res.status}`);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'unknown error');
    }
  });

  if (submitted) {
    return (
      <section className="container-reading py-12">
        <Card title={t('appointment.success.title')} description={t('appointment.success.body')} />
      </section>
    );
  }

  return (
    <section className="container-reading py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('appointment.title')}</h1>
      <p className="mb-6 text-ink-soft">{t('appointment.subtitle')}</p>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label={t('appointment.field.patientName')}
          required
          error={formState.errors.patientName?.message}
        >
          {(p) => (
            <input
              {...p}
              {...register('patientName')}
              autoComplete="name"
              className="h-12 rounded-2xl border border-ink-strong/15 px-4"
            />
          )}
        </Field>

        <Field
          label={t('appointment.field.phone')}
          required
          error={formState.errors.phone?.message}
        >
          {(p) => (
            <input
              {...p}
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+962…"
              className="h-12 rounded-2xl border border-ink-strong/15 px-4"
            />
          )}
        </Field>

        <Field
          label={t('appointment.field.reason')}
          required
          error={formState.errors.reason?.message}
        >
          {(p) => (
            <textarea
              {...p}
              {...register('reason')}
              rows={3}
              className="rounded-2xl border border-ink-strong/15 px-4 py-3"
            />
          )}
        </Field>

        <Field label={t('appointment.field.preferredWindow')}>
          {(p) => (
            <select
              {...p}
              {...register('preferredWindow')}
              className="h-12 rounded-2xl border border-ink-strong/15 px-4"
            >
              <option value="any">{t('appointment.window.any')}</option>
              <option value="morning">{t('appointment.window.morning')}</option>
              <option value="afternoon">{t('appointment.window.afternoon')}</option>
              <option value="evening">{t('appointment.window.evening')}</option>
            </select>
          )}
        </Field>

        <Field
          label={t('appointment.field.preferredDates')}
          required
          hint={t('appointment.field.preferredDates.hint')}
        >
          {(p) => (
            <input
              {...p}
              {...register('preferredDates', {
                setValueAs: (v: string) =>
                  String(v)
                    .split(',')
                    .map((d) => d.trim())
                    .filter(Boolean),
              })}
              type="text"
              placeholder="2026-06-01, 2026-06-02"
              className="h-12 rounded-2xl border border-ink-strong/15 px-4"
            />
          )}
        </Field>

        {serverError ? (
          <p role="alert" className="text-accent-copper">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" loading={formState.isSubmitting}>
          {t('appointment.submit')}
        </Button>
      </form>
    </section>
  );
}
