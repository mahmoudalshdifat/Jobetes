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

const valid = {
  patientName: 'Layla Haddad',
  phone: '+962799123456',
  preferredLocale: 'ar',
  reason: 'follow up on heartburn',
  preferredDates: ['2026-06-01'],
};

describe('Appointment routes', () => {
  it('POST /appointments accepts valid request', async () => {
    const res = await app.inject({ method: 'POST', url: '/appointments', payload: valid });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toMatch(/[0-9a-f-]{36}/u);
    expect(body.status).toBe('requested');
  });

  it('POST /appointments rejects invalid request', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/appointments',
      payload: { ...valid, phone: 'bad' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /appointments/:id round-trips', async () => {
    const create = await app.inject({ method: 'POST', url: '/appointments', payload: valid });
    const { id } = create.json();
    const fetched = await app.inject({ method: 'GET', url: `/appointments/${id}` });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().id).toBe(id);
    expect(fetched.json().reason).toBe(valid.reason);
    expect(fetched.json().preferredDates).toEqual(valid.preferredDates);
  });

  it('GET /appointments/:id 404 unknown', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/appointments/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});
