import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: '@jobetes/api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async () => ({ ready: true }));
}
