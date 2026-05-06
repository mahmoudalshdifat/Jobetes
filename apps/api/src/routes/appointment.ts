import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { AppointmentRequestSchema } from '@jobetes/shared-schemas';

/**
 * Phase-0 appointment requests live in process memory. The doctor receives
 * a notification via the operator bot (out of band) and confirms manually.
 * Phase 1 will swap this for Postgres + Google Calendar + email.
 */
const requests = new Map<string, { id: string; receivedAt: string; status: 'requested' }>();

/**
 * Fire-and-forget notification to the operator webhook (operator-bot or an
 * alerting service). Errors are swallowed so they never affect the patient
 * response — the log is the audit trail.
 */
async function notifyWebhook(
  webhookUrl: string,
  event: string,
  payload: Record<string, unknown>,
  log: { warn: (obj: object, msg?: string) => void },
): Promise<void> {
  if (!webhookUrl) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      log.warn({ webhookStatus: res.status, event }, 'notify webhook returned non-ok status');
    }
  } catch (err) {
    log.warn({ err, event }, 'notify webhook call failed (swallowed)');
  }
}

export async function registerAppointmentRoutes(
  app: FastifyInstance,
  notifyWebhookUrl = '',
): Promise<void> {
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

    // Notify operator (fire-and-forget — never blocks patient response).
    void notifyWebhook(
      notifyWebhookUrl,
      'appointment.requested',
      {
        appointmentId: id,
        patientName: parsed.data.patientName,
        preferredWindow: parsed.data.preferredWindow,
        preferredLocale: parsed.data.preferredLocale,
      },
      request.log,
    );

    return reply.status(201).send(record);
  });

  app.get('/appointments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = requests.get(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return record;
  });
}
