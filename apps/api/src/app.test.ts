import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error', GEMINI_API_KEY: '' });
});

afterAll(async () => {
  await app.close();
});

const validIntakeBody = {
  firstName: 'Layla',
  lastName: 'Haddad',
  dateOfBirth: '1971-05-12',
  gender: 'female',
  preferredLocale: 'ar',
  phone: '+962799123456',
  primarySymptoms: ['abdominal_pain'],
  severity: 6,
  currentMedications: [],
  knownAllergies: [],
  knownConditions: [],
  consent: {
    privacyPolicyVersion: '2026-05-04',
    acceptedAt: new Date().toISOString(),
    presentedLocale: 'ar',
    termsOfService: true,
    privacyPolicy: true,
    processingHealthData: true,
    crossBorderTransfer: true,
  },
};

describe('API smoke', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('GET /doctor/profile returns Dr. Al-Shdaifat', async () => {
    const res = await app.inject({ method: 'GET', url: '/doctor/profile' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fullName).toMatch(/Al-Shdaifat/);
    expect(body.hospital).toMatch(/Anna Hospital/);
    expect(body.languages).toEqual(expect.arrayContaining(['de', 'en', 'ar']));
  });

  it('POST /intake accepts a valid intake', async () => {
    const res = await app.inject({ method: 'POST', url: '/intake', payload: validIntakeBody });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('id');
  });

  it('POST /intake rejects invalid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/intake',
      payload: { ...validIntakeBody, phone: 'not-e164' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /ai/triage returns a non-diagnostic result via mock provider', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ai/triage',
      payload: {
        primarySymptoms: ['heartburn_reflux'],
        severity: 4,
        currentMedications: [],
        knownAllergies: [],
        knownConditions: [],
        preferredLocale: 'en',
        ramadanContext: false,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('urgency');
    expect(body).toHaveProperty('disclaimer');
    expect(body.disclaimer).toMatch(/911|112|emergency/iu);
    expect(body.modelMeta.provider).toBe('mock');
  });

  it('POST /v1/intake mirrors POST /intake (versioned route)', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/intake', payload: validIntakeBody });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('id');
  });

  it('GET /v1/health does NOT exist (health is unversioned)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(404);
  });
});
