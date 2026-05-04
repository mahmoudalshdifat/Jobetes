import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { AppConfig } from './config.js';

/**
 * OpenAPI 3.1 spec served at /openapi.json + Swagger UI at /docs.
 * Disabled in production by default — flip `EXPOSE_DOCS=true` if you want
 * the docs UI public. The JSON spec is always emitted to disk by tests.
 */
export async function registerOpenApi(app: FastifyInstance, cfg: AppConfig): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Jobetes API',
        description:
          'Cross-border telemedicine API. All routes return JSON. Patient-scoped routes require a Supabase Bearer token.',
        version: '0.1.0',
        contact: { email: 'wanderwellcare@gmail.com' },
        license: { name: 'Proprietary', url: 'https://github.com/mahmoudalshdifat/Jobetes' },
      },
      servers: [
        { url: 'https://jobetes-api.fly.dev', description: 'production' },
        { url: 'http://localhost:3000', description: 'local dev' },
      ],
      tags: [
        { name: 'public', description: 'Public unauthenticated routes' },
        { name: 'intake', description: 'Patient intake submission and lookup' },
        { name: 'ai', description: 'Non-diagnostic AI triage' },
        { name: 'me', description: 'Authenticated patient self-service' },
      ],
      components: {
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase access token',
          },
        },
      },
    },
  });

  if (cfg.NODE_ENV !== 'production' || process.env.EXPOSE_DOCS === 'true') {
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: true },
    });
  }
}
