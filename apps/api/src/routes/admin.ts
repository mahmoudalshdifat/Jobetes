import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

const DOCTOR_USER_IDS = new Set(
  (process.env.DOCTOR_SUPABASE_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/**
 * Doctor-facing admin endpoints. Authenticated AND allowlisted by Supabase
 * user-id (set DOCTOR_SUPABASE_USER_IDS in env). Returns 404 for non-doctors
 * to avoid leaking the route's existence.
 */
function requireDoctor(supabaseUserId: string): boolean {
  if (DOCTOR_USER_IDS.size === 0) return false;
  return DOCTOR_USER_IDS.has(supabaseUserId);
}

export async function registerAdminRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
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
