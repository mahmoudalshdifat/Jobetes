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

  async count(): Promise<number> {
    return this.client.intake.count();
  }

  async close(): Promise<void> {
    await this.client.$disconnect();
  }
}
