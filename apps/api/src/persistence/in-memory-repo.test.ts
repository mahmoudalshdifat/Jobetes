import { describe, expect, it } from 'vitest';
import type { PatientIntake } from '@jobetes/shared-schemas';
import { InMemoryIntakeRepo } from './in-memory-repo.js';

const sample: PatientIntake = {
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
  isFasting: false,
  ramadanContext: false,
  consent: {
    privacyPolicyVersion: '2026-05-04',
    acceptedAt: new Date().toISOString(),
    presentedLocale: 'ar',
    termsOfService: true,
    privacyPolicy: true,
    processingHealthData: true,
    crossBorderTransfer: true,
    marketingOptIn: false,
    familyAccessOptIn: false,
  },
};

describe('InMemoryIntakeRepo', () => {
  it('creates a record with id + ISO timestamp', async () => {
    const repo = new InMemoryIntakeRepo();
    const r = await repo.create(sample);
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/u);
    expect(new Date(r.receivedAt).toString()).not.toBe('Invalid Date');
    expect(repo.kind).toBe('memory');
  });

  it('findById returns the same record after create', async () => {
    const repo = new InMemoryIntakeRepo();
    const r = await repo.create(sample);
    const found = await repo.findById(r.id);
    expect(found).toEqual(r);
  });

  it('findById returns null for unknown id', async () => {
    const repo = new InMemoryIntakeRepo();
    expect(await repo.findById('does-not-exist')).toBeNull();
  });

  it('count tracks created records', async () => {
    const repo = new InMemoryIntakeRepo();
    expect(await repo.count()).toBe(0);
    await repo.create(sample);
    await repo.create(sample);
    expect(await repo.count()).toBe(2);
  });

  it('close is a no-op', async () => {
    const repo = new InMemoryIntakeRepo();
    await expect(repo.close()).resolves.toBeUndefined();
  });
});
