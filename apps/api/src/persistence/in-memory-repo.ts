import { randomUUID } from 'node:crypto';
import type { AppointmentRequest, PatientIntake } from '@jobetes/shared-schemas';
import type { AppointmentRecord, AppointmentUpdate, IntakeRepo, IntakeRecord } from './types.js';

/**
 * Phase-0 default. Holds intake IDs in process memory; the patient payload
 * itself is intentionally NOT persisted — it lives only as long as the request
 * that processed it. This keeps Phase 0 GDPR-trivial: no data → no leak risk.
 */
export class InMemoryIntakeRepo implements IntakeRepo {
  readonly kind = 'memory' as const;
  private readonly store = new Map<string, IntakeRecord>();
  private readonly userToPhone = new Map<string, string>();
  private readonly appointments = new Map<string, AppointmentRecord>();

  async create(_data: PatientIntake): Promise<IntakeRecord> {
    const id = randomUUID();
    const receivedAt = new Date().toISOString();
    const record: IntakeRecord = { id, receivedAt };
    this.store.set(id, record);
    return record;
  }

  async findById(id: string): Promise<IntakeRecord | null> {
    return this.store.get(id) ?? null;
  }

  async createAppointment(data: AppointmentRequest): Promise<AppointmentRecord> {
    const id = randomUUID();
    const receivedAt = new Date().toISOString();
    const record: AppointmentRecord = {
      id,
      receivedAt,
      status: 'requested',
      patientName: data.patientName,
      phone: data.phone,
      preferredLocale: data.preferredLocale,
      reason: data.reason,
      preferredWindow: data.preferredWindow,
      preferredDates: data.preferredDates,
      notes: data.notes,
    };
    this.appointments.set(id, record);
    return record;
  }

  async findAppointmentById(id: string): Promise<AppointmentRecord | null> {
    return this.appointments.get(id) ?? null;
  }

  async findAppointmentsByPhone(phone: string): Promise<AppointmentRecord[]> {
    return Array.from(this.appointments.values())
      .filter((appointment) => appointment.phone === phone)
      .sort((left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime());
  }

  async findAllAppointments(): Promise<AppointmentRecord[]> {
    return Array.from(this.appointments.values()).sort(
      (left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime(),
    );
  }

  async updateAppointment(
    id: string,
    update: AppointmentUpdate,
  ): Promise<Pick<AppointmentRecord, 'id' | 'status' | 'scheduledAt'> | null> {
    const appointment = this.appointments.get(id);
    if (!appointment) return null;
    const next = {
      ...appointment,
      status: update.status ?? appointment.status,
      scheduledAt: update.scheduledAt ?? appointment.scheduledAt,
    };
    this.appointments.set(id, next);
    return { id: next.id, status: next.status, scheduledAt: next.scheduledAt };
  }

  async findByUser(_supabaseUserId: string): Promise<IntakeRecord[]> {
    // No patient identity concept in Phase 0. Return empty consistently
    // so the API contract is stable across both adapters.
    return [];
  }

  async claimByPhone(_supabaseUserId: string, _phone: string): Promise<string | null> {
    // Phase 0: no patient registry — claim always fails
    return null;
  }

  async getPhoneByUser(supabaseUserId: string): Promise<string | null> {
    return this.userToPhone.get(supabaseUserId) ?? null;
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  async close(): Promise<void> {
    // no-op
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async findMany(options?: { limit?: number; offset?: number }): Promise<IntakeRecord[]> {
    const all = Array.from(this.store.values());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async exportPatientData(supabaseUserId: string): Promise<Record<string, unknown>> {
    const phone = this.userToPhone.get(supabaseUserId) ?? null;
    return {
      patient: null,
      intakes: [],
      appointments: [],
      consents: [],
      generatedAt: new Date().toISOString(),
      retentionPolicy: '24 months from last interaction, 10 years with explicit consent',
      dataController: 'Jobetes Health GmbH, contact@jobetes.diggai.de',
      ...(phone ? { linkedPhone: phone } : {}),
    };
  }

  async deletePatient(_supabaseUserId: string): Promise<boolean> {
    return false;
  }

  async updatePatient(_supabaseUserId: string, _data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>): Promise<boolean> {
    return false;
  }

  private readonly doctorIds = new Set<string>();

  async isStaff(supabaseUserId: string, role: 'doctor' | 'admin' | 'nurse' | 'operator'): Promise<boolean> {
    // Phase 0: fall back to env var for backward compatibility
    const envIds = new Set(
      (process.env.DOCTOR_SUPABASE_USER_IDS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    if (envIds.size > 0 && envIds.has(supabaseUserId)) return true;
    // Also support runtime registration for tests
    if (role === 'doctor' && this.doctorIds.has(supabaseUserId)) return true;
    return false;
  }

  /** Test helper: register a doctor ID at runtime. */
  registerDoctor(supabaseUserId: string): void {
    this.doctorIds.add(supabaseUserId);
  }
}
