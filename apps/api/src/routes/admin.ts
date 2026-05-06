import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

/**
 * Doctor-facing admin endpoints. Authenticated AND allowlisted by Supabase
 * user-id (set DOCTOR_SUPABASE_USER_IDS in env). Returns 404 for non-doctors
 * to avoid leaking the route's existence.
 *
 * NOTE: The allowlist is read from process.env at request time (not module
 * load time) so that tests can stub it without module reloading.
 */
function requireDoctor(supabaseUserId: string): boolean {
  const ids = new Set(
    (process.env.DOCTOR_SUPABASE_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (ids.size === 0) return false;
  return ids.has(supabaseUserId);
}

import { z } from 'zod';

const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function registerAdminRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
  app.get('/admin/intakes', async (request, reply) => {
    const user = await requireAuth(request);
    if (!requireDoctor(user.supabaseUserId)) {
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
    if (!requireDoctor(user.supabaseUserId)) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return {
      total: await repo.count(),
      persistence: repo.kind,
      requestedAt: new Date().toISOString(),
    };
  });
}
