import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
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
    async () => ({ ready: true }),
  );
}
