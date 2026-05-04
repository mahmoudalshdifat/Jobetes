import type { Metric } from 'web-vitals';

/**
 * Real-User Metrics (RUM). Collects Core Web Vitals and forwards them to
 * Sentry as performance measurements when configured. No-op without Sentry.
 *
 * Privacy: only metric values + names are sent — never URLs with PHI query
 * params. We strip query and fragment from `navigation` entries before
 * shipping anything.
 */
export type WebVitalsCallback = (m: Metric) => void;

let onceFlag = false;

export async function initWebVitals(cb?: WebVitalsCallback): Promise<void> {
  if (onceFlag) return;
  onceFlag = true;
  if (typeof window === 'undefined') return;
  // Lazy-import so the bundle doesn't ship web-vitals to non-RUM users.
  const { onCLS, onFCP, onLCP, onINP, onTTFB } = await import('web-vitals');
  const handler = (m: Metric) => {
    cb?.(m);
  };
  onCLS(handler);
  onFCP(handler);
  onLCP(handler);
  onINP(handler);
  onTTFB(handler);
}

/** Reset for tests. */
export function _resetWebVitalsOnceFlag(): void {
  onceFlag = false;
}
