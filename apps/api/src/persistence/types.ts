import type { AppointmentRequest, AppointmentStatus, PatientIntake } from '@jobetes/shared-schemas';

export type IntakeRecord = {
  id: string;
  receivedAt: string;
};

export type AppointmentRecord = {
  id: string;
  receivedAt: string;
  status: AppointmentStatus;
  patientName: string;
  phone: string;
  preferredLocale: string;
  reason: string;
  preferredWindow: string;
  preferredDates: string[];
  notes?: string;
  scheduledAt?: string;
};

export type AppointmentUpdate = {
  status?: AppointmentStatus;
  scheduledAt?: string;
};

/**
 * Repository contract for patient intake persistence.
 *
 * Two implementations:
 *  - InMemoryIntakeRepo (Phase 0, default) — stores nothing on disk
 *  - PrismaIntakeRepo (Phase 1) — Postgres via Prisma when DATABASE_URL is set
 *
 * Both expose the same surface so the API route doesn't care which backs it.
 */
export interface IntakeRepo {
  readonly kind: 'memory' | 'prisma';
  create(data: PatientIntake): Promise<IntakeRecord>;
  findById(id: string): Promise<IntakeRecord | null>;
  createAppointment(data: AppointmentRequest): Promise<AppointmentRecord>;
  findAppointmentById(id: string): Promise<AppointmentRecord | null>;
  findAppointmentsByPhone(phone: string): Promise<AppointmentRecord[]>;
  findAllAppointments(): Promise<AppointmentRecord[]>;
  updateAppointment(id: string, update: AppointmentUpdate): Promise<Pick<AppointmentRecord, 'id' | 'status' | 'scheduledAt'> | null>;
  count(): Promise<number>;
  /**
   * Patient-scoped intake list. In-memory adapter has no patient concept,
   * so it returns an empty array. Prisma adapter joins via `Patient.supabaseUserId`.
   */
  findByUser(supabaseUserId: string): Promise<IntakeRecord[]>;
  /**
   * Link an existing patient (matched by phone) to a Supabase user. Idempotent.
   * Returns the linked patient ID, or null if no patient was found.
   */
  claimByPhone(supabaseUserId: string, phone: string): Promise<string | null>;
  /** Optional cleanup hook (closes Prisma client; no-op for memory). */
  close(): Promise<void>;
  /** Health check — true if the backing store is reachable. */
  ping(): Promise<boolean>;
  /** Paginated list of all intakes (admin/doctor view). */
  findMany(options?: { limit?: number; offset?: number }): Promise<IntakeRecord[]>;
  /**
   * Return the phone number linked to a Supabase user, or null if not claimed.
   */
  getPhoneByUser(supabaseUserId: string): Promise<string | null>;
  /**
   * Export all patient data for data portability (GDPR Art. 20).
   */
  exportPatientData(supabaseUserId: string): Promise<Record<string, unknown> | null>;
  /**
   * Delete patient and all related data (GDPR Art. 17 right to erasure).
   */
  deletePatient(supabaseUserId: string): Promise<boolean>;
  /**
   * Update patient profile fields (GDPR Art. 16 right to rectification).
   */
  updatePatient(supabaseUserId: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>): Promise<boolean>;
}
