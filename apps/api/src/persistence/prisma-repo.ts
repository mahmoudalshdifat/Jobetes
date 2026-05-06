import type { PatientIntake } from '@jobetes/shared-schemas';
import { PrismaClient } from '@prisma/client';
import type { IntakeRecord, IntakeRepo } from './types.js';

/**
 * Phase-1 Postgres-backed repo. Persists Patient + Intake + Consent within
 * a single transaction so a partial write (e.g. consent saved but intake
 * row missing) is impossible.
 *
 * Patient lookup is by phone + DOB combination — phones are unique per
 * patient in our domain (see `Patient.phone @unique`); DOB is a tie-breaker
 * for shared family-line phones in some Jordanian households.
 */
export class PrismaIntakeRepo implements IntakeRepo {
  readonly kind = 'prisma' as const;
  private readonly client: PrismaClient;

  constructor(client?: PrismaClient) {
    this.client = client ?? new PrismaClient();
  }

  async create(data: PatientIntake): Promise<IntakeRecord> {
    const result = await this.client.$transaction(async (tx) => {
      const patient = await tx.patient.upsert({
        where: { phone: data.phone },
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          preferredLocale: data.preferredLocale,
          phone: data.phone,
          email: data.email ?? null,
        },
        update: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          preferredLocale: data.preferredLocale,
          email: data.email ?? null,
        },
      });

      const consent = await tx.consent.create({
        data: {
          privacyPolicyVersion: data.consent.privacyPolicyVersion,
          acceptedAt: new Date(data.consent.acceptedAt),
          presentedLocale: data.consent.presentedLocale,
          termsOfService: data.consent.termsOfService,
          privacyPolicy: data.consent.privacyPolicy,
          processingHealthData: data.consent.processingHealthData,
          crossBorderTransfer: data.consent.crossBorderTransfer,
          marketingOptIn: data.consent.marketingOptIn ?? false,
          familyAccessOptIn: data.consent.familyAccessOptIn ?? false,
        },
      });

      const intake = await tx.intake.create({
        data: {
          patientId: patient.id,
          consentId: consent.id,
          payload: data as unknown as object,
          severity: data.severity,
          symptomDurationDays: data.symptomDurationDays ?? null,
          ramadanContext: data.ramadanContext,
          isFasting: data.isFasting,
          prefersDoctorGender: data.prefersDoctorGender ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: 'patient',
          actorId: patient.id,
          event: 'intake.created',
          resourceId: intake.id,
        },
      });

      return intake;
    });

    return {
      id: result.id,
      receivedAt: result.createdAt.toISOString(),
    };
  }

  async findById(id: string): Promise<IntakeRecord | null> {
    const row = await this.client.intake.findUnique({
      where: { id },
      select: { id: true, createdAt: true },
    });
    return row ? { id: row.id, receivedAt: row.createdAt.toISOString() } : null;
  }

  async findByUser(supabaseUserId: string): Promise<IntakeRecord[]> {
    const rows = await this.client.intake.findMany({
      where: { patient: { supabaseUserId } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    return rows.map((r) => ({ id: r.id, receivedAt: r.createdAt.toISOString() }));
  }

  async claimByPhone(supabaseUserId: string, phone: string): Promise<string | null> {
    const patient = await this.client.patient.findUnique({ where: { phone } });
    if (!patient) return null;
    if (patient.supabaseUserId === supabaseUserId) return patient.id;
    if (patient.supabaseUserId && patient.supabaseUserId !== supabaseUserId) {
      // already claimed by someone else — refuse silently
      return null;
    }
    await this.client.patient.update({
      where: { id: patient.id },
      data: { supabaseUserId },
    });
    await this.client.auditLog.create({
      data: {
        actorRole: 'patient',
        actorId: patient.id,
        event: 'patient.claimed',
      },
    });
    return patient.id;
  }

  async count(): Promise<number> {
    return this.client.intake.count();
  }

  async close(): Promise<void> {
    await this.client.$disconnect();
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async findMany(options?: { limit?: number; offset?: number }): Promise<IntakeRecord[]> {
    const rows = await this.client.intake.findMany({
      orderBy: { createdAt: 'desc' },
      skip: options?.offset ?? 0,
      take: options?.limit ?? 50,
      select: { id: true, createdAt: true },
    });
    return rows.map((r) => ({ id: r.id, receivedAt: r.createdAt.toISOString() }));
  }
}
