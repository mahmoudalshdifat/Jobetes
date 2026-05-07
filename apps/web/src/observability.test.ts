import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Metric } from 'web-vitals';

const sentryAddBreadcrumb = vi.fn();
const sentrySetMeasurement = vi.fn();
const sentryInit = vi.fn();

vi.mock('@sentry/react', () => ({
  init: sentryInit,
  addBreadcrumb: sentryAddBreadcrumb,
  setMeasurement: sentrySetMeasurement,
}));

beforeEach(() => {
  vi.resetModules(); // critical — observability.js reads import.meta.env at call time
  vi.unstubAllEnvs();
  sentryAddBreadcrumb.mockClear();
  sentrySetMeasurement.mockClear();
  sentryInit.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const METRIC: Metric = {
  name: 'LCP',
  value: 2400,
  id: 'metric-1',
  rating: 'needs-improvement',
  delta: 0,
  entries: [],
  navigationType: 'navigate',
};

describe('initObservability', () => {
  it('is a no-op when VITE_SENTRY_DSN is unset', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const { initObservability } = await import('./observability.js');
    initObservability();
    expect(sentryInit).not.toHaveBeenCalled();
  });

  it('calls Sentry.init with sendDefaultPii: false when DSN is set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example.ingest.sentry.io/1');
    const { initObservability } = await import('./observability.js');
    initObservability();
    expect(sentryInit).toHaveBeenCalledOnce();
    const cfg = sentryInit.mock.calls[0]?.[0];
    expect(cfg.dsn).toBe('https://example.ingest.sentry.io/1');
    expect(cfg.sendDefaultPii).toBe(false);
    expect(typeof cfg.beforeSend).toBe('function');
  });
});

describe('reportVitalToSentry', () => {
  it('is a no-op when DSN unset (no breadcrumb, no measurement)', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const { reportVitalToSentry } = await import('./observability.js');
    reportVitalToSentry(METRIC);
    expect(sentryAddBreadcrumb).not.toHaveBeenCalled();
    expect(sentrySetMeasurement).not.toHaveBeenCalled();
  });

  it('sends a setMeasurement + breadcrumb when DSN set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://x.ingest.sentry.io/2');
    const { reportVitalToSentry } = await import('./observability.js');
    reportVitalToSentry(METRIC);
    expect(sentrySetMeasurement).toHaveBeenCalledWith('vital.lcp', 2400, 'millisecond');
    expect(sentryAddBreadcrumb).toHaveBeenCalledOnce();
    const crumb = sentryAddBreadcrumb.mock.calls[0]?.[0];
    expect(crumb.category).toBe('web-vital');
    expect(crumb.message).toMatch(/LCP 2400\.00/u);
    expect(crumb.data.rating).toBe('needs-improvement');
  });

  it('uses unit "none" for CLS (a unitless ratio)', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://x.ingest.sentry.io/2');
    const { reportVitalToSentry } = await import('./observability.js');
    reportVitalToSentry({ ...METRIC, name: 'CLS', value: 0.05 });
    expect(sentrySetMeasurement).toHaveBeenCalledWith('vital.cls', 0.05, 'none');
  });
});
