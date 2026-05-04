import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { PatientIntakeSchema } from '@jobetes/shared-schemas';

/**
 * In-memory intake store. Phase 0 keeps no persisted patient data on disk —
 * GDPR-friendly. Phase 1 swaps this for a Prisma-backed Postgres adapter
 * in the EU region.
 */
const store = new Map<string, { id: string; receivedAt: string }>();

export async function registerIntakeRoutes(app: FastifyInstance): Promise<void> {
  app.post('/intake', async (request, reply) => {
    const parsed = PatientIntakeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_intake',
        issues: parsed.error.issues,
      });
    }
    const id = randomUUID();
    const receivedAt = new Date().toISOString();
    store.set(id, { id, receivedAt });
    request.log.info({ intakeId: id }, 'intake received');
    return reply.status(201).send({ id, receivedAt });
  });

  app.get('/intake/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = store.get(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return record;
  });
}
