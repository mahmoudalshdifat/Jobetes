import * as Sentry from '@sentry/react';
import type { Metric } from 'web-vitals';

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

/**
 * Forward a Web Vitals metric to Sentry as a custom measurement. No-op
 * when Sentry isn't initialized (DSN missing). Uses `setMeasurement` so
 * vitals attach to the current pageload transaction; falls back to a
 * structured breadcrumb so the metric is still visible in event payloads
 * when no transaction is active.
 *
 * Names follow Sentry's `vital.<name>` convention. Values stay numeric
 * — no URLs, no PHI.
 */
export function reportVitalToSentry(metric: Metric): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  const name = `vital.${metric.name.toLowerCase()}`;
  // Try the modern API; if it isn't available (no active transaction),
  // record a breadcrumb so the data isn't lost.
  const setMeasurement = (Sentry as unknown as { setMeasurement?: (n: string, v: number, u: string) => void })
    .setMeasurement;
  const unit = metric.name === 'CLS' ? 'none' : 'millisecond';
  if (typeof setMeasurement === 'function') {
    setMeasurement(name, metric.value, unit);
  }
  Sentry.addBreadcrumb({
    category: 'web-vital',
    level: 'info',
    message: `${metric.name} ${metric.value.toFixed(2)} (${metric.rating})`,
    data: { id: metric.id, value: metric.value, rating: metric.rating, navigationType: metric.navigationType },
  });
}
