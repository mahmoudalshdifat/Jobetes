import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

/**
 * Authenticated patient self-service routes.
 *
 *   GET /me/intakes — returns the count and IDs of intakes for the
 *   authenticated patient. Phase 0 (in-memory) returns the global count
 *   for the *current process* — there's no patient identity to scope by
 *   yet. Phase 1 (Prisma) filters by `Patient.supabaseUserId` once that
 *   column is wired in (next iteration).
 */
export async function registerMeRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
  app.get('/me', async (request) => {
    const user = await requireAuth(request);
    return { user };
  });

  app.get('/me/intakes', async (request) => {
    await requireAuth(request);
    const total = await repo.count();
    return { total, persistence: repo.kind };
  });
}
