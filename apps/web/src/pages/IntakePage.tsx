import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button, Card, Field, Stepper } from '@jobetes/ui';
import { PatientIntakeSchema, type PatientIntake, type Locale } from '@jobetes/shared-schemas';
import type { TriageResult } from '@jobetes/shared-schemas';

// Client-side form schema — relaxes array min(1) so empty textareas don't block
// navigation; the API re-validates with the strict PatientIntakeSchema.
const IntakeFormSchema = PatientIntakeSchema.extend({
  currentMedications: z.array(z.string().max(200)).default([]),
  knownAllergies: z.array(z.string().max(200)).default([]),
  knownConditions: z.array(z.string().max(200)).default([]),
});

const STEPS = [
  'intake.step.identity',
  'intake.step.symptoms',
  'intake.step.context',
  'intake.step.consent',
  'intake.step.review',
] as const;

const TOTAL_STEPS = STEPS.length;

export function IntakePage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const { register, handleSubmit, formState, control } = useForm<PatientIntake>({
    resolver: zodResolver(IntakeFormSchema),
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

  // Watch values for the review step
  const watched = useWatch({ control });

  const onSubmit = handleSubmit(async (data) => {
    // Filter empty textarea entries and set acceptedAt at submit time
    const submitData: PatientIntake = {
      ...data,
      currentMedications: (data.currentMedications ?? []).filter((s) => s.trim()),
      knownAllergies: (data.knownAllergies ?? []).filter((s) => s.trim()),
      knownConditions: (data.knownConditions ?? []).filter((s) => s.trim()),
      consent: { ...data.consent, acceptedAt: new Date().toISOString() },
    };

    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    if (!res.ok) return;
    setSubmitted(true);

    // Phase 3: AI triage — fire and update state when ready
    const triagePayload = {
      primarySymptoms: submitData.primarySymptoms,
      symptomsOtherText: submitData.symptomsOtherText,
      symptomDurationDays: submitData.symptomDurationDays,
      severity: submitData.severity,
      currentMedications: submitData.currentMedications,
      knownAllergies: submitData.knownAllergies,
      knownConditions: submitData.knownConditions,
      preferredLocale: submitData.preferredLocale,
      ramadanContext: submitData.ramadanContext,
    };
    fetch('/api/ai/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(triagePayload),
    })
      .then(async (r) => {
        if (r.ok) setTriageResult((await r.json()) as TriageResult);
      })
      .catch(() => undefined);
  });

  if (submitted) {
    return (
      <section className="container-reading py-12 space-y-6">
        <Card
          title={t('intake.success')}
          description={t('intake.success.body')}
        />
        {triageResult ? (
          <div className={`rounded-3xl border p-6 ${
            triageResult.urgency === 'emergency'
              ? 'border-red-300 bg-red-50'
              : triageResult.urgency === 'soon'
                ? 'border-amber-300 bg-amber-50'
                : 'border-emerald-300 bg-emerald-50'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">
              {t('triage.heading')}
            </p>
            <p className="text-base font-semibold text-ink-strong capitalize">
              {t(`triage.urgency.${triageResult.urgency}`)}
            </p>
            {triageResult.patientFriendlySummary ? (
              <p className="mt-2 text-sm text-ink-soft">{triageResult.patientFriendlySummary}</p>
            ) : null}
            <p className="mt-4 text-xs text-ink-soft border-t border-ink-strong/10 pt-3">
              {t('triage.disclaimer')}
            </p>
          </div>
        ) : null}
        <p className="text-sm text-ink-soft">{t('emergency.banner')}</p>
      </section>
    );
  }

  return (
    <section className="container-reading py-12">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">{t('intake.title')}</h1>
      <Stepper steps={STEPS.map((k) => t(k))} currentIndex={stepIndex} className="mb-6" />

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        {/* Step 0 — Identity */}
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
              <Field label={t('intake.field.gender')} required error={formState.errors.gender?.message}>
                {(p) => (
                  <select {...p} {...register('gender')} className="h-12 rounded-2xl border border-ink-strong/15 px-4">
                    <option value="male">{t('gender.male')}</option>
                    <option value="female">{t('gender.female')}</option>
                    <option value="other">{t('gender.other')}</option>
                    <option value="prefer_not_to_say">{t('gender.prefer_not_to_say')}</option>
                  </select>
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
              <Field label={t('intake.field.email')} error={formState.errors.email?.message}>
                {(p) => (
                  <input
                    {...p}
                    {...register('email', { setValueAs: (v: string) => v === '' ? undefined : v })}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className="h-12 rounded-2xl border border-ink-strong/15 px-4"
                  />
                )}
              </Field>
            </div>
          </Card>
        ) : null}

        {/* Step 1 — Symptoms */}
        {stepIndex === 1 ? (
          <Card title={t('intake.step.symptoms')}>
            <Field label={t('intake.field.symptoms')} required>
              {(p) => (
                <select
                  {...p}
                  multiple
                  size={7}
                  {...register('primarySymptoms')}
                  className="rounded-2xl border border-ink-strong/15 p-3 w-full"
                >
                  <option value="abdominal_pain">{t('symptom.abdominal_pain')}</option>
                  <option value="heartburn_reflux">{t('symptom.heartburn_reflux')}</option>
                  <option value="bloating">{t('symptom.bloating')}</option>
                  <option value="nausea_vomiting">{t('symptom.nausea_vomiting')}</option>
                  <option value="diarrhea">{t('symptom.diarrhea')}</option>
                  <option value="constipation">{t('symptom.constipation')}</option>
                  <option value="blood_in_stool">{t('symptom.blood_in_stool')}</option>
                  <option value="unintentional_weight_loss">{t('symptom.unintentional_weight_loss')}</option>
                  <option value="difficulty_swallowing">{t('symptom.difficulty_swallowing')}</option>
                  <option value="jaundice">{t('symptom.jaundice')}</option>
                  <option value="other">{t('symptom.other')}</option>
                </select>
              )}
            </Field>
            <Field label={t('intake.field.symptomDuration')} error={formState.errors.symptomDurationDays?.message}>
              {(p) => (
                <input
                  {...p}
                  {...register('symptomDurationDays', { setValueAs: (v: string) => v === '' ? undefined : Number(v) })}
                  type="number"
                  min={0}
                  max={1825}
                  inputMode="numeric"
                  className="h-12 rounded-2xl border border-ink-strong/15 px-4 w-full"
                />
              )}
            </Field>
            <Field label={t('intake.field.severity')} required error={formState.errors.severity?.message}>
              {(p) => (
                <div className="space-y-2">
                  <input
                    {...p}
                    {...register('severity', { valueAsNumber: true })}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-ink-soft">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              )}
            </Field>
            <Field label={t('intake.field.symptoms.other')} hint={t('intake.field.symptoms.other.hint')}>
              {(p) => (
                <textarea
                  {...p}
                  {...register('symptomsOtherText')}
                  rows={2}
                  maxLength={500}
                  className="rounded-2xl border border-ink-strong/15 px-4 py-3 w-full"
                />
              )}
            </Field>
            <Field label={t('intake.field.medications')}>
              {(p) => (
                <textarea
                  {...p}
                  {...register('currentMedications.0')}
                  rows={2}
                  placeholder={t('intake.field.medications.hint')}
                  className="rounded-2xl border border-ink-strong/15 px-4 py-3 w-full"
                />
              )}
            </Field>
            <Field label={t('intake.field.allergies')}>
              {(p) => (
                <input
                  {...p}
                  {...register('knownAllergies.0')}
                  type="text"
                  className="h-12 rounded-2xl border border-ink-strong/15 px-4 w-full"
                />
              )}
            </Field>
            <Field label={t('intake.field.conditions')}>
              {(p) => (
                <input
                  {...p}
                  {...register('knownConditions.0')}
                  type="text"
                  className="h-12 rounded-2xl border border-ink-strong/15 px-4 w-full"
                />
              )}
            </Field>
          </Card>
        ) : null}

        {/* Step 2 — Cultural context */}
        {stepIndex === 2 ? (
          <Card title={t('intake.step.context')}>
            <Field label={t('intake.field.doctorGenderPreference')}>
              {(p) => (
                <select {...p} {...register('prefersDoctorGender', { setValueAs: (v: string) => v === '' ? undefined : v })} className="h-12 rounded-2xl border border-ink-strong/15 px-4 w-full">
                  <option value="">{t('gender.no_preference')}</option>
                  <option value="male">{t('gender.male')}</option>
                  <option value="female">{t('gender.female')}</option>
                </select>
              )}
            </Field>
            <label className="mt-4 flex items-center gap-2">
              <input type="checkbox" {...register('ramadanContext')} />
              <span>{t('intake.field.ramadan')}</span>
            </label>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" {...register('isFasting')} />
              <span>{t('intake.field.fasting')}</span>
            </label>
          </Card>
        ) : null}

        {/* Step 3 — Consent */}
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

        {/* Step 4 — Review */}
        {stepIndex === 4 ? (
          <Card title={t('intake.step.review')}>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.firstName')}</dt>
                <dd>{watched.firstName} {watched.lastName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.dob')}</dt>
                <dd>{watched.dateOfBirth}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.phone')}</dt>
                <dd>{watched.phone}</dd>
              </div>
              {watched.email ? (
                <div className="flex gap-2">
                  <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.email')}</dt>
                  <dd>{watched.email}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.symptoms')}</dt>
                <dd>{(watched.primarySymptoms ?? []).map((s) => t(`symptom.${s}`)).join(', ')}</dd>
              </div>
              {watched.symptomDurationDays != null && !isNaN(watched.symptomDurationDays) ? (
                <div className="flex gap-2">
                  <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.symptomDuration')}</dt>
                  <dd>{watched.symptomDurationDays} {t('intake.field.symptomDuration.unit')}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 font-medium text-ink-soft">{t('intake.field.severity')}</dt>
                <dd>{watched.severity} / 10</dd>
              </div>
            </dl>
            <p className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              {t('intake.review.disclaimer')}
            </p>
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
          {stepIndex < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={() => setStepIndex((i) => Math.min(TOTAL_STEPS - 1, i + 1))}>
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

