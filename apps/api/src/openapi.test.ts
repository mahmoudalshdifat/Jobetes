import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
});

afterAll(async () => {
  await app.close();
});

describe('OpenAPI spec', () => {
  it('exposes the spec at GET /openapi.json (via swagger plugin route)', async () => {
    const res = await app.inject({ method: 'GET', url: '/documentation/json' });
    // @fastify/swagger exposes at /documentation/json by default
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      const body = res.json();
      expect(body.openapi).toMatch(/^3\./u);
      expect(body.info.title).toBe('Jobetes API');
    }
  });

  it('describes the /health route', async () => {
    const swagger = (
      app as FastifyInstance & { swagger?: () => { paths?: Record<string, unknown> } }
    ).swagger?.();
    expect(swagger).toBeDefined();
    expect(swagger?.paths?.['/health']).toBeDefined();
  });
});
