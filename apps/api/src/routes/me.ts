import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PhoneSchema } from '@jobetes/shared-schemas';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

const ClaimSchema = z.object({ phone: PhoneSchema });

const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Authenticated patient self-service routes.
 *
 *   GET  /me                — returns the authenticated user.
 *   GET  /me/intakes        — patient-scoped list (Prisma); empty array on
 *                              in-memory adapter (Phase 0 has no patient-
 *                              identity concept).
 *   POST /me/claim          — links the authenticated user to an existing
 *                              patient row by phone number. Idempotent.
 */
export async function registerMeRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
  app.get('/me', async (request) => {
    const user = await requireAuth(request);
    return { user };
  });

  app.get('/me/intakes', async (request, reply) => {
    const user = await requireAuth(request);
    const query = PaginationQuery.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: 'invalid_query', issues: query.error.issues });
    }
    const all = await repo.findByUser(user.supabaseUserId);
    const { limit, offset } = query.data;
    const intakes = all.slice(offset, offset + limit);
    return {
      total: all.length,
      limit,
      offset,
      intakes,
      persistence: repo.kind,
    };
  });

  app.post('/me/claim', async (request, reply) => {
    const user = await requireAuth(request);
    const parsed = ClaimSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_phone', issues: parsed.error.issues });
    }
    const patientId = await repo.claimByPhone(user.supabaseUserId, parsed.data.phone);
    if (!patientId) {
      return reply.status(404).send({ error: 'no_patient_found' });
    }
    return { patientId };
  });
}
