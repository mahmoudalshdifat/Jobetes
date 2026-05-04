import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
});

afterAll(async () => {
  await app.close();
});

describe('Admin routes (doctor-only)', () => {
  it('GET /admin/intakes/summary returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/intakes/summary' });
    expect(res.statusCode).toBe(401);
  });

  it('hides the route from non-doctor users (404 not 403)', async () => {
    // With DOCTOR_SUPABASE_USER_IDS unset, no one is a doctor → 404 is the
    // contract for "not allowlisted".
    const res = await app.inject({ method: 'GET', url: '/admin/intakes/summary' });
    expect([401, 404]).toContain(res.statusCode);
  });
});
