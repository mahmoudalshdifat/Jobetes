import type { FastifyInstance } from 'fastify';
import { PatientIntakeSchema } from '@jobetes/shared-schemas';
import type { IntakeRepo } from '../persistence/index.js';

export async function registerIntakeRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
): Promise<void> {
  app.post('/intake', async (request, reply) => {
    const parsed = PatientIntakeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_intake',
        issues: parsed.error.issues,
      });
    }
    try {
      const record = await repo.create(parsed.data);
      request.log.info(
        { intakeId: record.id, persistence: repo.kind },
        'intake received',
      );
      return reply.status(201).send(record);
    } catch (err) {
      request.log.error({ err }, 'intake persistence failed');
      return reply.status(500).send({ error: 'persistence_unavailable' });
    }
  });

  app.get('/intake/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = await repo.findById(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return record;
  });
}
