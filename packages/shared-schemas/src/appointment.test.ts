import { describe, expect, it } from 'vitest';
import { AppointmentRequestSchema, AppointmentStatusSchema } from './appointment.js';

const valid = {
  patientName: 'Layla Haddad',
  phone: '+962799123456',
  preferredLocale: 'ar' as const,
  reason: 'follow up on heartburn',
  preferredDates: ['2026-06-01', '2026-06-02'],
};

describe('AppointmentRequestSchema', () => {
  it('accepts a minimal valid request', () => {
    expect(() => AppointmentRequestSchema.parse(valid)).not.toThrow();
  });

  it('defaults preferredWindow to "any"', () => {
    const parsed = AppointmentRequestSchema.parse(valid);
    expect(parsed.preferredWindow).toBe('any');
  });

  it('rejects bad phone', () => {
    expect(() => AppointmentRequestSchema.parse({ ...valid, phone: '079' })).toThrow();
  });

  it('rejects empty preferredDates', () => {
    expect(() => AppointmentRequestSchema.parse({ ...valid, preferredDates: [] })).toThrow();
  });

  it('rejects too-many preferredDates (>7)', () => {
    expect(() =>
      AppointmentRequestSchema.parse({
        ...valid,
        preferredDates: Array.from({ length: 8 }, (_, i) => `2026-06-0${(i % 9) + 1}`),
      }),
    ).toThrow();
  });

  it('rejects malformed date', () => {
    expect(() =>
      AppointmentRequestSchema.parse({ ...valid, preferredDates: ['01/06/2026'] }),
    ).toThrow();
  });

  it('AppointmentStatusSchema covers the full lifecycle', () => {
    for (const s of ['requested', 'confirmed', 'rescheduled', 'cancelled', 'completed'] as const) {
      expect(() => AppointmentStatusSchema.parse(s)).not.toThrow();
    }
    expect(() => AppointmentStatusSchema.parse('approved')).toThrow();
  });
});
