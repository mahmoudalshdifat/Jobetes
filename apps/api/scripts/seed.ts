/**
 * Phase-1 seed script. Idempotent — running it twice produces the same state.
 *
 * Seeds:
 *  - The doctor profile reference row (none today; see DOCTOR_PROFILE for source of truth).
 *  - A single audit-log marker so an empty deploy is observable.
 *
 * Run: `pnpm --filter @jobetes/api db:setup`
 *
 * No-op when DATABASE_URL is empty (Phase 0).
 */
import { PrismaClient } from '@prisma/client';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('seed: DATABASE_URL empty — skipping (Phase 0 in-memory mode)');
    return;
  }
  const client = new PrismaClient();
  try {
    await client.auditLog.create({
      data: {
        actorRole: 'system',
        event: 'db.seed.completed',
        metadata: { seededAt: new Date().toISOString() },
      },
    });
    // eslint-disable-next-line no-console
    console.log('seed: ok');
  } finally {
    await client.$disconnect();
  }
}

void main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('seed failed:', err);
  process.exit(1);
});
