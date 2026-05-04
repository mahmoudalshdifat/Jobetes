import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { InMemoryIntakeRepo } from '../persistence/index.js';

let app: FastifyInstance;
const repo = new InMemoryIntakeRepo();

beforeAll(async () => {
  // Bypass auth by injecting `request.user` via an inline preHandler before
  // the official auth hook. Phase-0 mock-mode rejects all Bearer tokens, so
  // we patch user state directly for testing the route logic.
  app = await buildApp({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    SUPABASE_URL: '',
    intakeRepo: repo,
  });
  app.addHook('preHandler', async (request) => {
    if (request.url.startsWith('/me')) {
      request.user = { supabaseUserId: 'test-user-id', email: 'test@example.com' };
    }
  });
});

afterAll(async () => {
  await app.close();
});

describe('GET /me + GET /me/intakes (with synthesized auth)', () => {
  it('GET /me returns the user', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.supabaseUserId).toBe('test-user-id');
    expect(body.user.email).toBe('test@example.com');
  });

  it('GET /me/intakes returns total + intakes + persistence kind', async () => {
    const res = await app.inject({ method: 'GET', url: '/me/intakes' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(0);
    expect(body.intakes).toEqual([]);
    expect(body.persistence).toBe('memory');
  });

  it('POST /me/claim 400 on invalid phone', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/me/claim',
      payload: { phone: 'not-e164' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /me/claim 404 on Phase-0 in-memory adapter (no patient registry)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/me/claim',
      payload: { phone: '+962799123456' },
    });
    expect(res.statusCode).toBe(404);
  });
});
