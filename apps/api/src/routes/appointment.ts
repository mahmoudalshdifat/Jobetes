import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppointmentRequestSchema, AppointmentStatusSchema } from '@jobetes/shared-schemas';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

/**
 * Phase-0 appointment requests live in process memory. The doctor receives
 * a notification via the operator bot (out of band) and confirms manually.
 * Phase 1 will swap this for Postgres + Google Calendar + email.
 */
type AppointmentRecord = {
  id: string;
  receivedAt: string;
  status: z.infer<typeof AppointmentStatusSchema>;
  patientName: string;
  phone: string;
  preferredLocale: string;
  reason: string;
  preferredWindow: string;
  preferredDates: string[];
  notes?: string;
  scheduledAt?: string;
};

const requests = new Map<string, AppointmentRecord>();

export function findAppointmentsByPhone(phone: string): AppointmentRecord[] {
  return Array.from(requests.values())
    .filter((r) => r.phone === phone)
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
}

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

const UpdateAppointmentSchema = z.object({
  status: AppointmentStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function registerAppointmentRoutes(
  app: FastifyInstance,
  repo: IntakeRepo,
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
    const record: AppointmentRecord = {
      id,
      receivedAt: new Date().toISOString(),
      status: 'requested',
      patientName: parsed.data.patientName,
      phone: parsed.data.phone,
      preferredLocale: parsed.data.preferredLocale,
      reason: parsed.data.reason,
      preferredWindow: parsed.data.preferredWindow,
      preferredDates: parsed.data.preferredDates,
      notes: parsed.data.notes,
    };
    requests.set(id, record);
    request.log.info({ appointmentId: id }, 'appointment requested');

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

    return reply.status(201).send({
      id: record.id,
      receivedAt: record.receivedAt,
      status: record.status,
    });
  });

  app.get('/appointments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const record = requests.get(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return {
      id: record.id,
      receivedAt: record.receivedAt,
      status: record.status,
      patientName: record.patientName,
      phone: record.phone,
      preferredLocale: record.preferredLocale,
      reason: record.reason,
      preferredWindow: record.preferredWindow,
      preferredDates: record.preferredDates,
      notes: record.notes,
      scheduledAt: record.scheduledAt,
    };
  });

  // Admin/doctor: list all appointments
  app.get('/admin/appointments', async (request, reply) => {
    const user = await requireAuth(request);
    if (!(await repo.isStaff(user.supabaseUserId, 'doctor'))) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const all = Array.from(requests.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
    return {
      total: all.length,
      appointments: all.map((r) => ({
        id: r.id,
        receivedAt: r.receivedAt,
        status: r.status,
        patientName: r.patientName,
        phone: r.phone,
        preferredLocale: r.preferredLocale,
        reason: r.reason,
        scheduledAt: r.scheduledAt,
      })),
    };
  });

  // Admin/doctor: update appointment status
  app.patch('/admin/appointments/:id', async (request, reply) => {
    const user = await requireAuth(request);
    if (!(await repo.isStaff(user.supabaseUserId, 'doctor'))) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const { id } = request.params as { id: string };
    const record = requests.get(id);
    if (!record) return reply.status(404).send({ error: 'not_found' });

    const parsed = UpdateAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_update', issues: parsed.error.issues });
    }

    if (parsed.data.status) record.status = parsed.data.status;
    if (parsed.data.scheduledAt) record.scheduledAt = parsed.data.scheduledAt;

    request.log.info({ appointmentId: id, status: record.status }, 'appointment updated');

    void notifyWebhook(
      notifyWebhookUrl,
      'appointment.updated',
      { appointmentId: id, status: record.status, scheduledAt: record.scheduledAt },
      request.log,
    );

    return { id: record.id, status: record.status, scheduledAt: record.scheduledAt };
  });
}
