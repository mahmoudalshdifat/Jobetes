import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    SUPABASE_URL: '', // mock mode — no JWKS, no real auth
  });
});

afterAll(async () => {
  await app.close();
});

describe('auth (mock mode — SUPABASE_URL empty)', () => {
  it('GET /me/intakes responds 401 without Bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/me/intakes' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /me/intakes responds 401 even with a Bearer token in mock mode', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/me/intakes',
      headers: { authorization: 'Bearer pretend-jwt' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /me responds 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
  });

  it('public routes still work', async () => {
    const health = await app.inject({ method: 'GET', url: '/health' });
    expect(health.statusCode).toBe(200);
    const doctor = await app.inject({ method: 'GET', url: '/doctor/profile' });
    expect(doctor.statusCode).toBe(200);
  });
});
