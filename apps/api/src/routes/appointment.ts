import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppointmentRequestSchema } from '@jobetes/shared-schemas';

/**
 * Phase-0 appointment requests live in process memory. The doctor receives
 * a notification via the operator bot (out of band) and confirms manually.
 * Phase 1 will swap this for Postgres + Google Calendar + email.
 */
const requests = new Map<string, { id: string; receivedAt: string; status: 'requested' }>();

export async function registerAppointmentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/appointments', async (request, reply) => {
    const parsed = AppointmentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_appointment_request',
        issues: parsed.error.issues,
      });
    }
    const id = randomUUID();
    const record = {
      id,
      receivedAt: new Date().toISOString(),
      status: 'requested' as const,
    };
    requests.set(id, record);
    request.log.info({ appointmentId: id }, 'appointment requested');
    return reply.status(201).send(record);
  });

  app.get('/appointments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = requests.get(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return record;
  });
}
