import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PatientIntake } from '@jobetes/shared-schemas';
import { buildApp } from '../app.js';
import { InMemoryIntakeRepo } from '../persistence/index.js';

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

describe('Admin routes (authenticated doctor)', () => {
  let doctorApp: FastifyInstance;
  const repo = new InMemoryIntakeRepo();

  beforeAll(async () => {
    vi.stubEnv('DOCTOR_SUPABASE_USER_IDS', 'test-doctor-id');
    doctorApp = await buildApp({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      SUPABASE_URL: '',
      intakeRepo: repo,
    });
    // Bypass JWT auth: inject a pre-verified doctor identity directly.
    doctorApp.addHook('preHandler', async (request) => {
      if (request.url.startsWith('/admin')) {
        request.user = { supabaseUserId: 'test-doctor-id', email: 'doctor@example.com' };
      }
    });
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await doctorApp.close();
  });

  it('GET /admin/intakes/summary returns 200 for an allowlisted doctor', async () => {
    const res = await doctorApp.inject({ method: 'GET', url: '/admin/intakes/summary' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(0);
    expect(body.persistence).toBe('memory');
    expect(typeof body.requestedAt).toBe('string');
  });

  it('returns 404 for a non-allowlisted user even when authenticated', async () => {
    // Build a second app instance with a different user not in the allowlist.
    const nonDoctorApp = await buildApp({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      SUPABASE_URL: '',
      intakeRepo: repo,
    });
    nonDoctorApp.addHook('preHandler', async (request) => {
      if (request.url.startsWith('/admin')) {
        request.user = { supabaseUserId: 'other-user-id', email: 'other@example.com' };
      }
    });
    try {
      const res = await nonDoctorApp.inject({ method: 'GET', url: '/admin/intakes/summary' });
      expect(res.statusCode).toBe(404);
    } finally {
      await nonDoctorApp.close();
    }
  });

  it('summary count reflects stored intakes', async () => {
    const intake: PatientIntake = {
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1980-01-01',
      gender: 'male',
      preferredLocale: 'de',
      phone: '+962799000001',
      primarySymptoms: ['abdominal_pain'],
      severity: 4,
      currentMedications: [],
      knownAllergies: [],
      knownConditions: [],
      isFasting: false,
      ramadanContext: false,
      consent: {
        privacyPolicyVersion: '2026-05-04',
        acceptedAt: new Date().toISOString(),
        presentedLocale: 'de',
        termsOfService: true,
        privacyPolicy: true,
        processingHealthData: true,
        crossBorderTransfer: true,
        marketingOptIn: false,
        familyAccessOptIn: false,
      },
    };
    await repo.create(intake);
    const res = await doctorApp.inject({ method: 'GET', url: '/admin/intakes/summary' });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(1);
  });
});

