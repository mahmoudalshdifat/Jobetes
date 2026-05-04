import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('OpenAPI spec snapshot', () => {
  it('lists every known route in the spec', () => {
    const spec = app.swagger() as { paths?: Record<string, unknown>; info: { version: string } };
    const paths = Object.keys(spec.paths ?? {}).sort();
    expect(paths).toEqual(
      expect.arrayContaining([
        '/health',
        '/ready',
        '/doctor/profile',
        '/intake',
        '/intake/{id}',
        '/ai/triage',
        '/me',
        '/me/intakes',
        '/me/claim',
        '/appointments',
        '/appointments/{id}',
        '/admin/intakes/summary',
      ]),
    );
  });

  it('declares the bearer security scheme', () => {
    const spec = app.swagger() as {
      components?: { securitySchemes?: Record<string, { type: string; scheme: string }> };
    };
    expect(spec.components?.securitySchemes?.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });

  it('marks the API as semver', () => {
    const spec = app.swagger() as { info: { version: string } };
    expect(spec.info.version).toMatch(/^\d+\.\d+\.\d+$/u);
  });
});
