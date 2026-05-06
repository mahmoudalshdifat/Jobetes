import type { FastifyInstance } from 'fastify';
import { PatientIntakeSchema } from '@jobetes/shared-schemas';
import type { IntakeRepo } from '../persistence/index.js';

/**
 * Fire-and-forget webhook on new intake — notifies operator-bot or alerting.
 * Errors are swallowed so they never affect the patient response.
 */
async function notifyNewIntake(
  webhookUrl: string,
  record: { id: string; receivedAt: string },
  data: { preferredLocale: string; severity: number },
  log: { warn: (obj: object, msg?: string) => void },
): Promise<void> {
  if (!webhookUrl) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'intake.created',
        payload: { intakeId: record.id, receivedAt: record.receivedAt, ...data },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) log.warn({ webhookStatus: res.status }, 'notify webhook non-ok');
  } catch (err) {
    log.warn({ err }, 'notify webhook failed (swallowed)');
  }
}

export async function registerIntakeRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
  notifyWebhookUrl = '',
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
      void notifyNewIntake(
        notifyWebhookUrl,
        record,
        { preferredLocale: parsed.data.preferredLocale, severity: parsed.data.severity },
        request.log,
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
