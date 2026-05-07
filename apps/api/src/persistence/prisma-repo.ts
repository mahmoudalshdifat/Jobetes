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

  async getPhoneByUser(supabaseUserId: string): Promise<string | null> {
    const patient = await this.client.patient.findFirst({
      where: { supabaseUserId },
      select: { phone: true },
    });
    return patient?.phone ?? null;
  }

  async exportPatientData(supabaseUserId: string): Promise<Record<string, unknown> | null> {
    const patient = await this.client.patient.findFirst({
      where: { supabaseUserId },
      include: {
        intakes: { include: { consent: true, triage: true }, orderBy: { createdAt: 'desc' } },
        appointments: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!patient) return null;
    const { id, firstName, lastName, dateOfBirth, gender, preferredLocale, phone, email, createdAt, updatedAt } = patient;
    await this.client.auditLog.create({
      data: {
        actorRole: 'patient',
        actorId: patient.id,
        event: 'patient.data_exported',
        metadata: { scope: 'full_portability' },
      },
    });
    return {
      patient: { id, firstName, lastName, dateOfBirth: dateOfBirth.toISOString().slice(0, 10), gender, preferredLocale, phone, email, createdAt, updatedAt },
      intakes: patient.intakes.map((i) => ({
        id: i.id,
        createdAt: i.createdAt,
        severity: i.severity,
        symptomDurationDays: i.symptomDurationDays,
        ramadanContext: i.ramadanContext,
        isFasting: i.isFasting,
        prefersDoctorGender: i.prefersDoctorGender,
        consent: i.consent,
        triage: i.triage,
      })),
      appointments: patient.appointments.map((a) => ({
        id: a.id,
        status: a.status,
        requestedAt: a.requestedAt,
        scheduledAt: a.scheduledAt,
        notes: a.notes,
      })),
      messages: patient.messages.map((m) => ({
        id: m.id,
        fromRole: m.fromRole,
        body: m.body,
        locale: m.locale,
        createdAt: m.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };
  }

  async deletePatient(supabaseUserId: string): Promise<boolean> {
    const patient = await this.client.patient.findFirst({ where: { supabaseUserId } });
    if (!patient) return false;
    await this.client.$transaction([
      this.client.message.deleteMany({ where: { patientId: patient.id } }),
      this.client.triage.deleteMany({ where: { intake: { patientId: patient.id } } }),
      this.client.intake.deleteMany({ where: { patientId: patient.id } }),
      this.client.appointment.deleteMany({ where: { patientId: patient.id } }),
      this.client.consent.deleteMany({ where: { intake: { patientId: patient.id } } }),
      this.client.patient.delete({ where: { id: patient.id } }),
      this.client.auditLog.create({
        data: {
          actorRole: 'patient',
          actorId: patient.id,
          event: 'patient.deleted',
          metadata: { reason: 'gdpr_art_17' },
        },
      }),
    ]);
    return true;
  }

  async updatePatient(supabaseUserId: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>): Promise<boolean> {
    const patient = await this.client.patient.findFirst({ where: { supabaseUserId } });
    if (!patient) return false;
    await this.client.patient.update({
      where: { id: patient.id },
      data,
    });
    await this.client.auditLog.create({
      data: {
        actorRole: 'patient',
        actorId: patient.id,
        event: 'patient.updated',
        metadata: { fields: Object.keys(data) },
      },
    });
    return true;
  }
}
