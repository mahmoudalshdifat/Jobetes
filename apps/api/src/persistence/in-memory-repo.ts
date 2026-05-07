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
  private readonly userToPhone = new Map<string, string>();

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
}
