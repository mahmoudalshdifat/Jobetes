import type { FastifyInstance } from 'fastify';
import type { IntakeRepo } from '../persistence/index.js';

export async function registerHealthRoutes(app: FastifyInstance, repo?: IntakeRepo): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        tags: ['public'],
        summary: 'Liveness probe',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              service: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
            required: ['status', 'service', 'timestamp'],
          },
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      service: '@jobetes/api',
      timestamp: new Date().toISOString(),
    }),
  );

  app.get(
    '/ready',
    {
      schema: {
        tags: ['public'],
        summary: 'Readiness probe',
        response: {
          200: {
            type: 'object',
            properties: { ready: { type: 'boolean' } },
            required: ['ready'],
          },
        },
      },
    },
    async () => {
      const dbOk = repo ? await repo.ping() : true;
      return { ready: dbOk };
    },
  );
}
