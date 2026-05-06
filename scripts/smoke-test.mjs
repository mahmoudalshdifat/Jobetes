#!/usr/bin/env node
/**
 * Smoke-test script for Jobetes production endpoints.
 *
 * Usage:
 *   node scripts/smoke-test.mjs
 *   BASE_URL=https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1 \
 *     node scripts/smoke-test.mjs
 *
 * Tests all three transports:
 *   - Supabase Edge Functions (production default)
 *   - Fly.io Fastify API (if API_URL is set)
 *
 * Exit code 0 = all tests passed.
 * Exit code 1 = one or more tests failed.
 */

const EDGE_BASE =
  process.env.BASE_URL ??
  'https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1';
const API_BASE = process.env.API_URL ?? null;

let passed = 0;
let failed = 0;

async function check(label, fn) {
  process.stdout.write(`  ${label} … `);
  try {
    await fn();
    console.log('✓ ok');
    passed++;
  } catch (err) {
    console.log(`✗ FAILED — ${err.message}`);
    failed++;
  }
}

async function expectOk(res, label) {
  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(`HTTP ${res.status} from ${label}: ${body.slice(0, 200)}`);
  }
}

async function expectJson(res, label) {
  await expectOk(res, label);
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(`Expected JSON but got ${ct}`);
  }
  return res.json();
}

const INTAKE_PAYLOAD = {
  firstName: 'Layla',
  lastName: 'Haddad',
  dateOfBirth: '1971-05-12',
  gender: 'female',
  preferredLocale: 'ar',
  phone: '+962799000001',
  primarySymptoms: ['abdominal_pain'],
  severity: 4,
  isFasting: false,
  ramadanContext: false,
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

const TRIAGE_PAYLOAD = {
  primarySymptoms: ['abdominal_pain'],
  severity: 4,
  currentMedications: [],
  knownAllergies: [],
  knownConditions: [],
  preferredLocale: 'ar',
  ramadanContext: false,
};

// ─── Edge Functions ────────────────────────────────────────────────────────
console.log(`\nEdge functions @ ${EDGE_BASE}`);

await check('GET /health → 200 + {status:"ok"}', async () => {
  const res = await fetch(`${EDGE_BASE}/health`);
  const body = await expectJson(res, '/health');
  if (body.status !== 'ok') throw new Error(`status = ${body.status}`);
});

await check('GET /doctor-profile → 200 + fullName present', async () => {
  const res = await fetch(`${EDGE_BASE}/doctor-profile`);
  const body = await expectJson(res, '/doctor-profile');
  if (!body.fullName) throw new Error('fullName missing');
  if (!body.bio?.ar) throw new Error('Arabic bio missing');
});

await check('POST /intake → 201 + id + receivedAt', async () => {
  const res = await fetch(`${EDGE_BASE}/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INTAKE_PAYLOAD),
  });
  const body = await expectJson(res, '/intake');
  if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
  if (!body.id) throw new Error('id missing from response');
  if (!body.receivedAt) throw new Error('receivedAt missing from response');
});

await check('POST /intake with missing fields → 400 validation error', async () => {
  const res = await fetch(`${EDGE_BASE}/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'only-one-field' }),
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

await check('POST /triage (mock or live) → urgency field present', async () => {
  const res = await fetch(`${EDGE_BASE}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TRIAGE_PAYLOAD),
  });
  const body = await expectJson(res, '/triage');
  const validUrgency = ['routine', 'soon', 'emergency', 'self_care_likely'];
  if (!validUrgency.includes(body.urgency)) {
    throw new Error(`Unexpected urgency: ${body.urgency}`);
  }
  if (!body.disclaimer) throw new Error('disclaimer missing');
});

// ─── Fastify API (optional) ────────────────────────────────────────────────
if (API_BASE) {
  console.log(`\nFastify API @ ${API_BASE}`);

  await check('GET /health → 200', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const body = await expectJson(res, '/health');
    if (body.status !== 'ok') throw new Error(`status = ${body.status}`);
  });

  await check('GET /doctor/profile → 200 + fullName', async () => {
    const res = await fetch(`${API_BASE}/doctor/profile`);
    const body = await expectJson(res, '/doctor/profile');
    if (!body.fullName) throw new Error('fullName missing');
  });

  await check('POST /ai/triage → urgency field', async () => {
    const res = await fetch(`${API_BASE}/ai/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TRIAGE_PAYLOAD),
    });
    const body = await expectJson(res, '/ai/triage');
    if (!body.urgency) throw new Error('urgency missing');
    if (!body.disclaimer) throw new Error('disclaimer missing');
  });
} else {
  console.log('\nFastify API skipped (set API_URL to enable)');
}

// ─── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
