import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppointmentRequestSchema, AppointmentStatusSchema } from '@jobetes/shared-schemas';
import { requireAuth } from '../auth.js';
import type { IntakeRepo } from '../persistence/index.js';

/**
 * Appointment requests are persisted through the active repository adapter.
 * Phase 0 still uses an in-memory store; Phase 1 switches to Postgres.
 */

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
    const record = await repo.createAppointment(parsed.data);
    request.log.info({ appointmentId: record.id, persistence: repo.kind }, 'appointment requested');

    void notifyWebhook(
      notifyWebhookUrl,
      'appointment.requested',
      {
        appointmentId: record.id,
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
    const record = await repo.findAppointmentById(id);
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
    const doctorIds = new Set(
      (process.env.DOCTOR_SUPABASE_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    );
    if (doctorIds.size > 0 && !doctorIds.has(user.supabaseUserId)) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const all = await repo.findAllAppointments();
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
    const doctorIds = new Set(
      (process.env.DOCTOR_SUPABASE_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    );
    if (doctorIds.size > 0 && !doctorIds.has(user.supabaseUserId)) {
      return reply.status(404).send({ error: 'not_found' });
    }
    const { id } = request.params as { id: string };

    const parsed = UpdateAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_update', issues: parsed.error.issues });
    }

    const updated = await repo.updateAppointment(id, parsed.data);
    if (!updated) return reply.status(404).send({ error: 'not_found' });

    request.log.info({ appointmentId: id, status: updated.status, persistence: repo.kind }, 'appointment updated');

    void notifyWebhook(
      notifyWebhookUrl,
      'appointment.updated',
      { appointmentId: id, status: updated.status, scheduledAt: updated.scheduledAt },
      request.log,
    );

    return updated;
  });
}
