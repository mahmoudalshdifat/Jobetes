import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Stepper } from '@jobetes/ui';
import { PatientIntakeSchema, type PatientIntake, type Locale } from '@jobetes/shared-schemas';

const STEPS = ['intake.step.identity', 'intake.step.symptoms', 'intake.step.context', 'intake.step.consent'] as const;

export function IntakePage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState } = useForm<PatientIntake>({
    resolver: zodResolver(PatientIntakeSchema),
    defaultValues: {
      preferredLocale: (i18n.resolvedLanguage ?? 'ar') as Locale,
      gender: 'prefer_not_to_say',
      primarySymptoms: [],
      severity: 0,
      currentMedications: [],
      knownAllergies: [],
      knownConditions: [],
      isFasting: false,
      ramadanContext: false,
      consent: {
        privacyPolicyVersion: '2026-05-04',
        acceptedAt: new Date().toISOString(),
        presentedLocale: (i18n.resolvedLanguage ?? 'ar') as Locale,
        termsOfService: false as unknown as true,
        privacyPolicy: false as unknown as true,
        processingHealthData: false as unknown as true,
        crossBorderTransfer: false as unknown as true,
      },
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) setSubmitted(true);
  });

  if (submitted) {
    return (
      <section className="container-reading py-12">
        <Card title={t('intake.success')} description={t('emergency.banner')}>
          <p className="text-ink-soft">{t('hero.subtitle')}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="container-reading py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('intake.title')}</h1>
      <Stepper steps={STEPS.map((k) => t(k))} currentIndex={stepIndex} className="mb-6" />

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {stepIndex === 0 ? (
          <Card title={t('intake.step.identity')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t('intake.field.firstName')} required error={formState.errors.firstName?.message}>
                {(p) => (
                  <input
                    {...p}
                    {...register('firstName')}
                    type="text"
                    autoComplete="given-name"
                    className="h-12 rounded-2xl border border-ink-strong/15 px-4"
                  />
                )}
              </Field>
              <Field label={t('intake.field.lastName')} required error={formState.errors.lastName?.message}>
                {(p) => (
                  <input
                    {...p}
                    {...register('lastName')}
                    type="text"
                    autoComplete="family-name"
                    className="h-12 rounded-2xl border border-ink-strong/15 px-4"
                  />
                )}
              </Field>
              <Field label={t('intake.field.dob')} required error={formState.errors.dateOfBirth?.message}>
                {(p) => (
                  <input
                    {...p}
                    {...register('dateOfBirth')}
                    type="date"
                    autoComplete="bday"
                    className="h-12 rounded-2xl border border-ink-strong/15 px-4"
                  />
                )}
              </Field>
              <Field label={t('intake.field.phone')} required error={formState.errors.phone?.message}>
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
            </div>
          </Card>
        ) : null}

        {stepIndex === 1 ? (
          <Card title={t('intake.step.symptoms')}>
            <Field label={t('intake.field.severity')} required error={formState.errors.severity?.message}>
              {(p) => (
                <input
                  {...p}
                  {...register('severity', { valueAsNumber: true })}
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                />
              )}
            </Field>
            <Field label={t('intake.field.symptoms')} required>
              {(p) => (
                <select
                  {...p}
                  multiple
                  size={6}
                  {...register('primarySymptoms')}
                  className="rounded-2xl border border-ink-strong/15 p-3"
                >
                  <option value="abdominal_pain">abdominal_pain</option>
                  <option value="heartburn_reflux">heartburn_reflux</option>
                  <option value="bloating">bloating</option>
                  <option value="nausea_vomiting">nausea_vomiting</option>
                  <option value="diarrhea">diarrhea</option>
                  <option value="constipation">constipation</option>
                  <option value="blood_in_stool">blood_in_stool</option>
                  <option value="unintentional_weight_loss">unintentional_weight_loss</option>
                  <option value="difficulty_swallowing">difficulty_swallowing</option>
                  <option value="jaundice">jaundice</option>
                  <option value="other">other</option>
                </select>
              )}
            </Field>
          </Card>
        ) : null}

        {stepIndex === 2 ? (
          <Card title={t('intake.step.context')}>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('ramadanContext')} />
              <span>{t('intake.field.ramadan')}</span>
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" {...register('isFasting')} />
              <span>{t('intake.field.fasting')}</span>
            </label>
          </Card>
        ) : null}

        {stepIndex === 3 ? (
          <Card title={t('intake.step.consent')}>
            <label className="flex items-start gap-2">
              <input type="checkbox" {...register('consent.termsOfService')} />
              <span>{t('intake.consent.tos')}</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" {...register('consent.privacyPolicy')} />
              <span>{t('intake.consent.privacy')}</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" {...register('consent.processingHealthData')} />
              <span>{t('intake.consent.health')}</span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" {...register('consent.crossBorderTransfer')} />
              <span>{t('intake.consent.crossBorder')}</span>
            </label>
          </Card>
        ) : null}

        <div className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            ←
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}>
              →
            </Button>
          ) : (
            <Button type="submit" loading={formState.isSubmitting}>
              {t('intake.submit')}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
