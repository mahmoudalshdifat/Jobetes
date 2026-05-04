import { describe, expect, it } from 'vitest';
import { PatientIntakeSchema } from './intake.js';

const baseValid = {
  firstName: 'Layla',
  lastName: 'Haddad',
  dateOfBirth: '1971-05-12',
  gender: 'female',
  preferredLocale: 'ar',
  phone: '+962799123456',
  primarySymptoms: ['abdominal_pain'],
  severity: 6,
  currentMedications: [],
  knownAllergies: [],
  knownConditions: [],
  consent: {
    privacyPolicyVersion: '2026-05-04',
    acceptedAt: new Date().toISOString(),
    presentedLocale: 'ar',
    termsOfService: true,
    privacyPolicy: true,
    processingHealthData: true,
    crossBorderTransfer: true,
  },
} as const;

describe('PatientIntakeSchema', () => {
  it('accepts a minimal valid intake', () => {
    expect(() => PatientIntakeSchema.parse(baseValid)).not.toThrow();
  });

  it('rejects bad phone format', () => {
    const bad = { ...baseValid, phone: '0799123456' };
    expect(() => PatientIntakeSchema.parse(bad)).toThrow(/E\.164/u);
  });

  it('rejects missing required consent flags', () => {
    const bad = {
      ...baseValid,
      consent: { ...baseValid.consent, processingHealthData: false as unknown as true },
    };
    expect(() => PatientIntakeSchema.parse(bad)).toThrow(/processingHealthData|health/iu);
  });

  it('clamps severity to 0..10', () => {
    expect(() => PatientIntakeSchema.parse({ ...baseValid, severity: 11 })).toThrow();
    expect(() => PatientIntakeSchema.parse({ ...baseValid, severity: -1 })).toThrow();
  });

  it('requires at least one primary symptom', () => {
    expect(() => PatientIntakeSchema.parse({ ...baseValid, primarySymptoms: [] })).toThrow();
  });

  it('accepts Ramadan context flag', () => {
    expect(() =>
      PatientIntakeSchema.parse({ ...baseValid, ramadanContext: true, isFasting: true }),
    ).not.toThrow();
  });
});
