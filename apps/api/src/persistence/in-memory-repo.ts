import { randomUUID } from 'node:crypto';
import type { PatientIntake } from '@jobetes/shared-schemas';
import type { IntakeRepo, IntakeRecord } from './types.js';

/**
 * Phase-0 default. Holds intake IDs in process memory; the patient payload
 * itself is intentionally NOT persisted — it lives only as long as the request
 * that processed it. This keeps Phase 0 GDPR-trivial: no data → no leak risk.
 */
export class InMemoryIntakeRepo implements IntakeRepo {
  readonly kind = 'memory' as const;
  private readonly store = new Map<string, IntakeRecord>();

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

  async count(): Promise<number> {
    return this.store.size;
  }

  async close(): Promise<void> {
    // no-op
  }
}
