import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from './config.js';

/**
 * Server-side observability. No-op when `SENTRY_DSN` is empty.
 * Phase 0 default: do not send to a hosted backend; logs go to stdout only.
 */
export function initObservability(cfg: AppConfig): void {
  if (!cfg.SENTRY_DSN) return;
  Sentry.init({
    dsn: cfg.SENTRY_DSN,
    environment: cfg.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

export function attachErrorHandler(app: FastifyInstance, cfg: AppConfig): void {
  if (!cfg.SENTRY_DSN) return;
  app.setErrorHandler((err, req, reply) => {
    Sentry.captureException(err, {
      tags: { route: req.url, method: req.method },
    });
    const status =
      typeof (err as { statusCode?: unknown }).statusCode === 'number'
        ? ((err as { statusCode: number }).statusCode ?? 500)
        : 500;
    req.log.error({ err }, 'unhandled error');
    void reply.status(status).send({ error: 'internal_error' });
  });
}
