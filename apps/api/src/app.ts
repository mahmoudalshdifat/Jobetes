import Fastify, { type FastifyInstance } from 'fastify';
import compress from '@fastify/compress';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { loadConfig, type AppConfig } from './config.js';
import { loggerOptions } from './logger.js';
import { attachAuth } from './auth.js';
import { attachErrorHandler, initObservability } from './observability.js';
import { registerOpenApi } from './openapi.js';
import { attachRequestId } from './request-id.js';
import { createIntakeRepo, type IntakeRepo } from './persistence/index.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerDoctorRoutes } from './routes/doctor.js';
import { registerIntakeRoutes } from './routes/intake.js';
import { registerAppointmentRoutes } from './routes/appointment.js';
import { registerMeRoutes } from './routes/me.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerTriageRoutes } from './routes/triage.js';

export type BuildAppOptions = Partial<AppConfig> & {
  intakeRepo?: IntakeRepo;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const { intakeRepo: repoOverride, ...overrideConfig } = options;
  const cfg = { ...loadConfig(), ...overrideConfig };
  initObservability(cfg);
  const app = Fastify({ logger: loggerOptions(cfg) });
  attachErrorHandler(app, cfg);

  const intakeRepo = repoOverride ?? createIntakeRepo(cfg.DATABASE_URL, app.log);
  app.addHook('onClose', async () => {
    await intakeRepo.close();
  });

  // Structured performance logging — every request emits timing + status.
  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        req: { method: request.method, url: request.url },
        res: { statusCode: reply.statusCode },
        responseTime: Math.round(reply.elapsedTime),
      },
      'request completed',
    );
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://www.annahospital.de'],
        connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    strictTransportSecurity: {
      maxAge: 63_072_000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
  });
  await app.register(cors, {
    origin: cfg.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 600,
  });
  // Tiered rate limits — stricter on write endpoints to deter spam/abuse.
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    skipOnError: false,
    keyGenerator: (req): string => {
      const fwd = req.headers['x-forwarded-for'];
      const first =
        typeof fwd === 'string' ? fwd.split(',')[0]?.trim() : Array.isArray(fwd) ? fwd[0] : '';
      return first ?? req.ip;
    },
  });
  await app.register(sensible);
  await app.register(compress, { global: true, encodings: ['br', 'gzip'] });

  await attachRequestId(app);
  await registerOpenApi(app, cfg);
  attachAuth(app, cfg);

  // API v1 — versioned routes (preferred)
  await app.register(async (v1) => {
    await registerDoctorRoutes(v1);
    await registerIntakeRoutes(v1, intakeRepo, cfg.NOTIFY_WEBHOOK_URL);
    await registerAppointmentRoutes(v1, cfg.NOTIFY_WEBHOOK_URL);
    await registerMeRoutes(v1, intakeRepo);
    await registerAdminRoutes(v1, intakeRepo);
    await registerTriageRoutes(v1, cfg);
  }, { prefix: '/v1' });

  // Unversioned aliases — backward compatibility during transition
  await registerHealthRoutes(app, intakeRepo);
  await registerDoctorRoutes(app);
  await registerIntakeRoutes(app, intakeRepo, cfg.NOTIFY_WEBHOOK_URL);
  await registerAppointmentRoutes(app, cfg.NOTIFY_WEBHOOK_URL);
  await registerMeRoutes(app, intakeRepo);
  await registerAdminRoutes(app, intakeRepo);
  await registerTriageRoutes(app, cfg);

  return app;
}
