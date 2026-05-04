import type { FastifyServerOptions } from 'fastify';
import type { AppConfig } from './config.js';

/**
 * PII-redacted logger options. Fields known to carry patient data are stripped.
 * GDPR Art. 5(1)(c): data minimization extends to logs.
 *
 * Returned as Fastify logger config (not a pre-built pino instance) so
 * Fastify's type system retains the default `FastifyBaseLogger` rather than
 * a narrowed pino-specific Logger type — keeps `app.register(...)` happy.
 */
export function loggerOptions(cfg: AppConfig): FastifyServerOptions['logger'] {
  return {
    level: cfg.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.firstName',
        'req.body.lastName',
        'req.body.dateOfBirth',
        'req.body.phone',
        'req.body.email',
        'res.headers["set-cookie"]',
        '*.password',
        '*.token',
      ],
      censor: '[REDACTED]',
    },
    transport:
      cfg.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  };
}
