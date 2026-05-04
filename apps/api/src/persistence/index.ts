import { InMemoryIntakeRepo } from './in-memory-repo.js';
import { PrismaIntakeRepo } from './prisma-repo.js';
import type { IntakeRepo } from './types.js';

export type { IntakeRecord, IntakeRepo } from './types.js';
export { InMemoryIntakeRepo } from './in-memory-repo.js';
export { PrismaIntakeRepo } from './prisma-repo.js';

/** Structural logger so this accepts both pino and Fastify's logger. */
type LogLike = { info: (obj: object, msg?: string) => void };

/**
 * Pick the right repo based on `DATABASE_URL`.
 *
 *  - empty / undefined → in-memory (Phase 0 default)
 *  - non-empty         → Prisma (Phase 1, Postgres)
 *
 * Logged once at boot so an operator can confirm which backend is active.
 */
export function createIntakeRepo(databaseUrl: string, log?: LogLike): IntakeRepo {
  if (!databaseUrl.trim()) {
    log?.info({ persistence: 'memory' }, 'intake persistence: in-memory (Phase 0)');
    return new InMemoryIntakeRepo();
  }
  log?.info({ persistence: 'prisma' }, 'intake persistence: Postgres via Prisma');
  return new PrismaIntakeRepo();
}
