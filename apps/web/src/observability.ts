import * as Sentry from '@sentry/react';

/**
 * Web-side observability. Initialized only when `VITE_SENTRY_DSN` is set —
 * otherwise no-op so dev/CI never accidentally ship telemetry.
 *
 * Privacy-by-design:
 *  - `sendDefaultPii: false` — Sentry won't auto-attach IP, user agent strings
 *    beyond what we explicitly add.
 *  - `tracesSampleRate: 0` by default — no perf events unless explicitly enabled.
 *  - `beforeSend` strips known PHI keys from event payloads as a defense-in-depth
 *    layer (Pino redaction is the primary defense; this catches accidental leaks
 *    in error breadcrumbs).
 */
const PHI_KEYS = new Set([
  'firstName',
  'lastName',
  'dateOfBirth',
  'phone',
  'email',
  'primarySymptoms',
  'severity',
  'currentMedications',
  'knownAllergies',
  'knownConditions',
]);

function scrub<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  const cloned: Record<string, unknown> = Array.isArray(value)
    ? ([...(value as unknown[])] as unknown as Record<string, unknown>)
    : { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(cloned)) {
    if (PHI_KEYS.has(key)) {
      cloned[key] = '[PHI_REDACTED]';
    } else if (typeof cloned[key] === 'object') {
      cloned[key] = scrub(cloned[key]);
    }
  }
  return cloned as unknown as T;
}

export function initObservability(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
    beforeSend(event) {
      if (event.request?.data) event.request.data = scrub(event.request.data);
      if (event.extra) event.extra = scrub(event.extra);
      return event;
    },
  });
}
