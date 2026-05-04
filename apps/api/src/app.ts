import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { loadConfig, type AppConfig } from './config.js';
import { loggerOptions } from './logger.js';
import { attachErrorHandler, initObservability } from './observability.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerDoctorRoutes } from './routes/doctor.js';
import { registerIntakeRoutes } from './routes/intake.js';
import { registerTriageRoutes } from './routes/triage.js';

export async function buildApp(overrideConfig?: Partial<AppConfig>): Promise<FastifyInstance> {
  const cfg = { ...loadConfig(), ...overrideConfig };
  initObservability(cfg);
  const app = Fastify({ logger: loggerOptions(cfg) });
  attachErrorHandler(app, cfg);

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
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });
  await app.register(cors, {
    origin: cfg.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  await app.register(sensible);

  await registerHealthRoutes(app);
  await registerDoctorRoutes(app);
  await registerIntakeRoutes(app);
  await registerTriageRoutes(app, cfg);

  return app;
}
