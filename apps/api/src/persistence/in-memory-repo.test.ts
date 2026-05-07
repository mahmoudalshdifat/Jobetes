import { describe, expect, it } from 'vitest';
import type { AppointmentRequest, PatientIntake } from '@jobetes/shared-schemas';
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

const appointment: AppointmentRequest = {
  patientName: 'Layla Haddad',
  phone: '+962799123456',
  preferredLocale: 'ar',
  reason: 'follow up on heartburn',
  preferredWindow: 'morning',
  preferredDates: ['2026-06-01'],
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

  it('findByUser returns empty array (Phase-0 has no patient identity)', async () => {
    const repo = new InMemoryIntakeRepo();
    await repo.create(sample);
    expect(await repo.findByUser('any-user')).toEqual([]);
  });

  it('claimByPhone returns null (Phase-0 has no patient registry)', async () => {
    const repo = new InMemoryIntakeRepo();
    expect(await repo.claimByPhone('user', '+962799123456')).toBeNull();
  });

  it('stores appointments in memory and can read them back by id and phone', async () => {
    const repo = new InMemoryIntakeRepo();
    const created = await repo.createAppointment(appointment);

    expect(created.status).toBe('requested');
    expect((await repo.findAppointmentById(created.id))?.reason).toBe('follow up on heartburn');
    expect(await repo.findAppointmentsByPhone(appointment.phone)).toHaveLength(1);
    expect(await repo.findAllAppointments()).toHaveLength(1);
  });

  it('updates appointment status and scheduledAt in memory', async () => {
    const repo = new InMemoryIntakeRepo();
    const created = await repo.createAppointment(appointment);

    const updated = await repo.updateAppointment(created.id, {
      status: 'confirmed',
      scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    expect(updated).toEqual({
      id: created.id,
      status: 'confirmed',
      scheduledAt: '2026-06-01T10:00:00.000Z',
    });
  });

  it('isStaff returns false by default; true after registerDoctor', async () => {
    const repo = new InMemoryIntakeRepo();
    expect(await repo.isStaff('any-id', 'doctor')).toBe(false);
    repo.registerDoctor('doc-1');
    expect(await repo.isStaff('doc-1', 'doctor')).toBe(true);
    expect(await repo.isStaff('doc-1', 'admin')).toBe(false);
  });
});
