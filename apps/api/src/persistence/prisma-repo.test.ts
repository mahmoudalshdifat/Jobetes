import { describe, expect, it, vi } from 'vitest';
import type { PatientIntake } from '@jobetes/shared-schemas';
import { PrismaIntakeRepo } from './prisma-repo.js';

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

/**
 * We don't have a live Postgres in CI. Instead, mock the small Prisma surface
 * the repo actually touches so we can prove the orchestration is correct
 * (upsert patient → create consent → create intake → audit log → return id).
 */
type FakeTx = {
  patient: { upsert: (args: { where: { phone: string } }) => Promise<{ id: string }> };
  consent: { create: () => Promise<{ id: string }> };
  intake: { create: () => Promise<{ id: string; createdAt: Date }> };
  auditLog: { create: () => Promise<void> };
};

function makeFakeClient(): { client: unknown; calls: string[] } {
  const calls: string[] = [];
  const tx: FakeTx = {
    patient: {
      upsert: vi.fn(async (args) => {
        calls.push(`upsert:${args.where.phone}`);
        return { id: 'patient-1' };
      }),
    },
    consent: {
      create: vi.fn(async () => {
        calls.push('consent.create');
        return { id: 'consent-1' };
      }),
    },
    intake: {
      create: vi.fn(async () => {
        calls.push('intake.create');
        return { id: 'intake-1', createdAt: new Date('2026-05-04T10:00:00Z') };
      }),
    },
    auditLog: {
      create: vi.fn(async () => {
        calls.push('auditLog.create');
      }),
    },
  };
  const client = {
    $transaction: vi.fn(async (cb: (tx: FakeTx) => Promise<unknown>) => cb(tx)),
    $disconnect: vi.fn(async () => {
      calls.push('disconnect');
    }),
    intake: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === 'intake-1'
          ? { id: 'intake-1', createdAt: new Date('2026-05-04T10:00:00Z') }
          : null,
      ),
      count: vi.fn(async () => 7),
    },
  };
  return { client, calls };
}

describe('PrismaIntakeRepo', () => {
  it('orchestrates patient upsert → consent → intake → audit log inside a single transaction', async () => {
    const { client, calls } = makeFakeClient();
    const repo = new PrismaIntakeRepo(client as never);
    const result = await repo.create(sample);
    expect(result.id).toBe('intake-1');
    expect(result.receivedAt).toBe('2026-05-04T10:00:00.000Z');
    expect(calls).toEqual([
      'upsert:+962799123456',
      'consent.create',
      'intake.create',
      'auditLog.create',
    ]);
    expect(repo.kind).toBe('prisma');
  });

  it('findById returns mapped record', async () => {
    const { client } = makeFakeClient();
    const repo = new PrismaIntakeRepo(client as never);
    const found = await repo.findById('intake-1');
    expect(found).toEqual({
      id: 'intake-1',
      receivedAt: '2026-05-04T10:00:00.000Z',
    });
  });

  it('findById returns null for unknown id', async () => {
    const { client } = makeFakeClient();
    const repo = new PrismaIntakeRepo(client as never);
    expect(await repo.findById('nope')).toBeNull();
  });

  it('count delegates to client.intake.count', async () => {
    const { client } = makeFakeClient();
    const repo = new PrismaIntakeRepo(client as never);
    expect(await repo.count()).toBe(7);
  });

  it('close calls $disconnect', async () => {
    const { client, calls } = makeFakeClient();
    const repo = new PrismaIntakeRepo(client as never);
    await repo.close();
    expect(calls).toContain('disconnect');
  });
});
