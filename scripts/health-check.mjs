#!/usr/bin/env node
/**
 * Jobetes — comprehensive health check script.
 *
 * Usage:
 *   node scripts/health-check.mjs              # check all default endpoints
 *   node scripts/health-check.mjs --staging    # check staging environment
 *   node scripts/health-check.mjs --api-only   # check API only
 *
 * Exit code 0 = all healthy, 1 = any failure.
 */

const ENDPOINTS = {
  production: {
    web: 'https://jobetes.diggai.de',
    api: 'https://jobetes-api.fly.dev',
    edge: {
      health: 'https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1/health',
      doctorProfile: 'https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1/doctor-profile',
    },
  },
  staging: {
    web: 'https://staging.jobetes.diggai.de',
    api: 'https://jobetes-api-staging.fly.dev',
    edge: {
      health: 'https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1/health',
      doctorProfile: 'https://kzzihkwkhnnoixgogxzj.supabase.co/functions/v1/doctor-profile',
    },
  },
};

const args = process.argv.slice(2);
const isStaging = args.includes('--staging');
const apiOnly = args.includes('--api-only');
const env = isStaging ? 'staging' : 'production';
const config = ENDPOINTS[env];

let failed = 0;
let passed = 0;

async function check(name, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
    const latency = Date.now() - start;
    if (res.ok) {
      console.log(`  ✅ ${name} — ${res.status} in ${latency}ms`);
      passed++;
      return true;
    }
    console.log(`  ❌ ${name} — ${res.status} in ${latency}ms`);
    failed++;
    return false;
  } catch (err) {
    console.log(`  ❌ ${name} — ${err.message}`);
    failed++;
    return false;
  }
}

async function main() {
  console.log(`\n🩺 Jobetes Health Check (${env})\n`);

  if (!apiOnly) {
    console.log('Web (GitHub Pages):');
    await check('home page', config.web);
    await check('legal page', `${config.web}/#/legal`);
  }

  console.log('\nAPI (Fly.io):');
  await check('health', `${config.api}/health`);
  await check('ready', `${config.api}/ready`);
  await check('doctor profile', `${config.api}/v1/doctor/profile`);

  console.log('\nEdge Functions (Supabase):');
  for (const [name, url] of Object.entries(config.edge)) {
    await check(name, url);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
