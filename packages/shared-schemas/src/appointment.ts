import { z } from 'zod';

export const AppointmentStatusSchema = z.enum([
  'requested',
  'confirmed',
  'rescheduled',
  'cancelled',
  'completed',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

/**
 * Phase-0 appointment request — patient asks for a slot. Doctor confirms
 * out-of-band; the resulting calendar invite is delivered via the operator
 * bot or email. Phase 1 will integrate Google Calendar.
 */
export const AppointmentRequestSchema = z.object({
  patientName: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+\d{6,16}$/u, 'phone must be in international E.164 format'),
  preferredLocale: z.enum(['ar', 'de', 'en']),
  reason: z.string().trim().min(3).max(500),
  preferredWindow: z.enum(['morning', 'afternoon', 'evening', 'any']).default('any'),
  preferredDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'must be ISO date'))
    .min(1)
    .max(7),
  notes: z.string().trim().max(1000).optional(),
});
export type AppointmentRequest = z.infer<typeof AppointmentRequestSchema>;

export const AppointmentRecordSchema = z.object({
  id: z.string(),
  receivedAt: z.string().datetime(),
  status: AppointmentStatusSchema,
});
export type AppointmentRecord = z.infer<typeof AppointmentRecordSchema>;
