import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

import { z } from 'zod';

const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Doctor-facing admin endpoints. Authenticated AND allowlisted.
 * Returns 404 for non-doctors to avoid leaking the route's existence.
 *
 * The allowlist is checked against the Staff table (Prisma) with a fallback
 * to DOCTOR_SUPABASE_USER_IDS env var during migration.
 */
export async function registerAdminRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
  app.get('/admin/intakes', async (request, reply) => {
    const user = await requireAuth(request);
    if (!(await repo.isStaff(user.supabaseUserId, 'doctor'))) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const query = PaginationQuery.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    const [total, intakes] = await Promise.all([
      repo.count(),
      repo.findMany({ limit: query.data.limit, offset: query.data.offset }),
    ]);
    return {
      total,
      limit: query.data.limit,
      offset: query.data.offset,
      intakes,
      persistence: repo.kind,
      requestedAt: new Date().toISOString(),
    };
  });

  app.get('/admin/intakes/summary', async (request, reply) => {
    const user = await requireAuth(request);
    if (!(await repo.isStaff(user.supabaseUserId, 'doctor'))) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return {
      total: await repo.count(),
      persistence: repo.kind,
      requestedAt: new Date().toISOString(),
    };
  });
}
