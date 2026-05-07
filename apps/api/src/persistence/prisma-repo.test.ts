import { describe, expect, it, vi } from 'vitest';
import type { AppointmentRequest, PatientIntake } from '@jobetes/shared-schemas';
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

const appointment: AppointmentRequest = {
  patientName: 'Layla Haddad',
  phone: '+962799123456',
  preferredLocale: 'ar',
  reason: 'follow up on heartburn',
  preferredWindow: 'morning',
  preferredDates: ['2026-06-01'],
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

  it('findByUser joins through patient.supabaseUserId', async () => {
    const findMany = vi.fn(async () => [
      { id: 'i-1', createdAt: new Date('2026-05-01T00:00:00Z') },
      { id: 'i-2', createdAt: new Date('2026-05-02T00:00:00Z') },
    ]);
    const client = { intake: { findMany } };
    const repo = new PrismaIntakeRepo(client as never);
    const result = await repo.findByUser('user-123');
    expect(findMany).toHaveBeenCalledWith({
      where: { patient: { supabaseUserId: 'user-123' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('i-1');
  });

  it('claimByPhone links a patient and writes audit log', async () => {
    const update = vi.fn(async () => ({}));
    const auditCreate = vi.fn(async () => ({}));
    const client = {
      patient: {
        findUnique: vi.fn(async () => ({ id: 'p-1', supabaseUserId: null })),
        update,
      },
      auditLog: { create: auditCreate },
    };
    const repo = new PrismaIntakeRepo(client as never);
    const result = await repo.claimByPhone('user-x', '+962799123456');
    expect(result).toBe('p-1');
    expect(update).toHaveBeenCalledOnce();
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event: 'patient.claimed', actorId: 'p-1' }),
      }),
    );
  });

  it('claimByPhone returns null when patient not found', async () => {
    const client = {
      patient: { findUnique: vi.fn(async () => null) },
    };
    const repo = new PrismaIntakeRepo(client as never);
    expect(await repo.claimByPhone('user-x', '+962799999999')).toBeNull();
  });

  it('claimByPhone is idempotent when already claimed by same user', async () => {
    const update = vi.fn();
    const client = {
      patient: {
        findUnique: vi.fn(async () => ({ id: 'p-1', supabaseUserId: 'same-user' })),
        update,
      },
      auditLog: { create: vi.fn() },
    };
    const repo = new PrismaIntakeRepo(client as never);
    expect(await repo.claimByPhone('same-user', '+962799123456')).toBe('p-1');
    expect(update).not.toHaveBeenCalled();
  });

  it('claimByPhone refuses cross-user takeover', async () => {
    const client = {
      patient: {
        findUnique: vi.fn(async () => ({ id: 'p-1', supabaseUserId: 'someone-else' })),
        update: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    };
    const repo = new PrismaIntakeRepo(client as never);
    expect(await repo.claimByPhone('attacker', '+962799123456')).toBeNull();
  });

  it('creates a persisted appointment with patient lookup and audit log', async () => {
    const auditCreate = vi.fn(async () => ({}));
    const appointmentCreate = vi.fn(async () => ({
      id: 'appt-1',
      requestedAt: new Date('2026-06-01T08:00:00Z'),
      status: 'requested',
      patientName: appointment.patientName,
      phone: appointment.phone,
      preferredLocale: appointment.preferredLocale,
      reason: appointment.reason,
      preferredWindow: appointment.preferredWindow,
      preferredDates: appointment.preferredDates,
      notes: null,
      scheduledAt: null,
    }));
    const client = {
      patient: { findUnique: vi.fn(async () => ({ id: 'p-1' })) },
      appointment: { create: appointmentCreate },
      auditLog: { create: auditCreate },
    };
    const repo = new PrismaIntakeRepo(client as never);

    const result = await repo.createAppointment(appointment);

    expect(appointmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ patientId: 'p-1', reason: appointment.reason }),
      }),
    );
    expect(result).toEqual({
      id: 'appt-1',
      receivedAt: '2026-06-01T08:00:00.000Z',
      status: 'requested',
      patientName: appointment.patientName,
      phone: appointment.phone,
      preferredLocale: appointment.preferredLocale,
      reason: appointment.reason,
      preferredWindow: appointment.preferredWindow,
      preferredDates: appointment.preferredDates,
      notes: undefined,
      scheduledAt: undefined,
    });
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event: 'appointment.requested', actorId: 'p-1' }),
      }),
    );
  });

  it('lists appointments by phone in descending requestedAt order', async () => {
    const findMany = vi.fn(async () => [
      {
        id: 'appt-2',
        requestedAt: new Date('2026-06-02T08:00:00Z'),
        status: 'confirmed',
        patientName: appointment.patientName,
        phone: appointment.phone,
        preferredLocale: appointment.preferredLocale,
        reason: appointment.reason,
        preferredWindow: appointment.preferredWindow,
        preferredDates: appointment.preferredDates,
        notes: null,
        scheduledAt: new Date('2026-06-03T09:00:00Z'),
      },
    ]);
    const client = { appointment: { findMany } };
    const repo = new PrismaIntakeRepo(client as never);

    const result = await repo.findAppointmentsByPhone(appointment.phone);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: appointment.phone }, orderBy: { requestedAt: 'desc' } }),
    );
    expect(result[0]).toEqual({
      id: 'appt-2',
      receivedAt: '2026-06-02T08:00:00.000Z',
      status: 'confirmed',
      patientName: appointment.patientName,
      phone: appointment.phone,
      preferredLocale: appointment.preferredLocale,
      reason: appointment.reason,
      preferredWindow: appointment.preferredWindow,
      preferredDates: appointment.preferredDates,
      notes: undefined,
      scheduledAt: '2026-06-03T09:00:00.000Z',
    });
  });

  it('updates appointment status and maps scheduledAt', async () => {
    const auditCreate = vi.fn(async () => ({}));
    const update = vi.fn(async () => ({
      id: 'appt-1',
      status: 'confirmed',
      scheduledAt: new Date('2026-06-01T10:00:00Z'),
    }));
    const client = {
      appointment: { update },
      auditLog: { create: auditCreate },
    };
    const repo = new PrismaIntakeRepo(client as never);

    const result = await repo.updateAppointment('appt-1', {
      status: 'confirmed',
      scheduledAt: '2026-06-01T10:00:00.000Z',
    });

    expect(result).toEqual({
      id: 'appt-1',
      status: 'confirmed',
      scheduledAt: '2026-06-01T10:00:00.000Z',
    });
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ event: 'appointment.updated', resourceId: 'appt-1' }),
      }),
    );
  });
});
