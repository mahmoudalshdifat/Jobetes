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
  /** Optional cleanup hook (closes Prisma client; no-op for memory). */
  close(): Promise<void>;
}
