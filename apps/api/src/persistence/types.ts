import type { PatientIntake } from '@jobetes/shared-schemas';

export type IntakeRecord = {
  id: string;
  receivedAt: string;
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
}
