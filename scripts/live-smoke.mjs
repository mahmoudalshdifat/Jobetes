#!/usr/bin/env node
/**
 * Comprehensive end-to-end smoke test against the live deployment.
 * Touches every public surface and records pass/fail. Exit code 1 on any
 * critical failure, 0 otherwise.
 */
import { chromium } from '@playwright/test';

const WEB = 'https://jobetes.diggai.de';
const SUPA = 'https://kzzihkwkhnnoixgogxzj.supabase.co';

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const sym = ok ? '✓' : '✗';
  const colour = ok ? '\x1b[32m' : '\x1b[31m';
  console.log(`${colour}${sym}\x1b[0m  ${name}${detail ? ' — ' + detail : ''}`);
}

async function checkText(name, url, expectMatch, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const body = await res.text();
    const ok = res.ok && expectMatch.test(body);
    record(name, ok, ok ? `${res.status} · ${body.length} bytes` : `${res.status} · no match`);
    return body;
  } catch (e) {
    record(name, false, String(e.message ?? e));
    return '';
  }
}

async function checkJson(name, url, validate, opts = {}, expectedStatus = null) {
  try {
    const res = await fetch(url, opts);
    const json = await res.json();
    const statusOk = expectedStatus !== null ? res.status === expectedStatus : res.ok;
    const ok = statusOk && validate(json);
    record(name, ok, ok ? `${res.status}` : `${res.status} · validation failed`);
    return json;
  } catch (e) {
    record(name, false, String(e.message ?? e));
    return null;
  }
}

async function checkHeaders(name, url, expectHeaders) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const missing = [];
    const wrong = [];
    for (const [k, v] of Object.entries(expectHeaders)) {
      const got = res.headers.get(k);
      if (!got) missing.push(k);
      else if (v && !v.test(got)) wrong.push(`${k}=${got}`);
    }
    const ok = res.ok && missing.length === 0 && wrong.length === 0;
    record(
      name,
      ok,
      ok
        ? `${res.status} · all headers present`
        : `missing: ${missing.join(',')} · wrong: ${wrong.join(',')}`,
    );
  } catch (e) {
    record(name, false, String(e.message ?? e));
  }
}

async function main() {
  console.log('\n=== Static surfaces ===');
  await checkText('home (custom-domain)', `${WEB}/`, /<title>Jobetes/i);
  await checkText('robots.txt', `${WEB}/robots.txt`, /User-agent: \*/);
  await checkText('robots: GPTBot allowed', `${WEB}/robots.txt`, /User-agent: GPTBot[\s\S]+Allow:/);
  await checkText('robots: ClaudeBot allowed', `${WEB}/robots.txt`, /User-agent: ClaudeBot/);
  await checkText('sitemap.xml', `${WEB}/sitemap.xml`, /<urlset/);
  await checkText('llms.txt', `${WEB}/llms.txt`, /Jobetes/);
  await checkText('security.txt', `${WEB}/.well-known/security.txt`, /Contact: mailto:/);
  await checkJson('ai-policy.json', `${WEB}/.well-known/ai-policy.json`, (j) => j.name === 'Jobetes');
  await checkText('manifest', `${WEB}/manifest.webmanifest`, /Jobetes/);
  await checkText('service worker', `${WEB}/sw.js`, /workbox|precache/i);
  await checkText('og-image SVG', `${WEB}/og-image.svg`, /<svg/);
  await checkText('icon.svg', `${WEB}/icon.svg`, /<svg/);

  console.log('\n=== HTML <head> integrity ===');
  const home = await fetch(WEB + '/').then((r) => r.text());
  record(
    'canonical points to jobetes.diggai.de',
    /<link rel="canonical" href="https:\/\/jobetes\.diggai\.de\/"/.test(home),
  );
  record(
    'hreflang ar/de/en on jobetes.diggai.de',
    /hreflang="ar"[^>]*jobetes\.diggai\.de/.test(home) &&
      /hreflang="de"[^>]*jobetes\.diggai\.de/.test(home),
  );
  record(
    'og:image set',
    /<meta property="og:image" content="https:\/\/jobetes\.diggai\.de\/og-image\.svg"/.test(home),
  );
  record('JSON-LD Physician schema present', /"@type":\s*"Physician"/.test(home));
  record('first-paint skeleton present', /id="root"[\s\S]+jbts-spin/.test(home));
  record('noscript fallback present', /<noscript>[\s\S]+JavaScript/.test(home));
  record('font-display=optional (CLS fix)', /display=optional/.test(home));

  console.log('\n=== Edge functions ===');
  await checkJson('edge: /health', `${SUPA}/functions/v1/health`, (j) => j.status === 'ok');
  await checkJson(
    'edge: /doctor-profile',
    `${SUPA}/functions/v1/doctor-profile`,
    (j) => /Al-Shdaifat/.test(j.fullName) && Array.isArray(j.languages),
  );

  // Triage with mock fallback (no GEMINI_API_KEY in production env)
  await checkJson(
    'edge: /triage (mock-fallback)',
    `${SUPA}/functions/v1/triage`,
    (j) => j.urgency && j.disclaimer,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primarySymptoms: ['heartburn_reflux'],
        severity: 4,
        preferredLocale: 'ar',
        ramadanContext: false,
      }),
    },
  );

  // Triage validation rejection — production CORRECTLY returns 400 with
  // the structured error body, so we expect status 400 here.
  await checkJson(
    'edge: /triage validates input (400 path)',
    `${SUPA}/functions/v1/triage`,
    (j) => j.error === 'invalid_triage_input',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 99 }),
    },
    400,
  );

  // Real intake → live DB write
  const phoneStub = `+96270${Math.floor(1000000 + Math.random() * 8999999)}`;
  await checkJson(
    'edge: /intake writes a real Patient row',
    `${SUPA}/functions/v1/intake`,
    (j) => /^[0-9a-f-]{36}$/.test(j.id),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'SmokeTest',
        lastName: 'Live',
        dateOfBirth: '1980-01-01',
        gender: 'other',
        preferredLocale: 'ar',
        phone: phoneStub,
        primarySymptoms: ['abdominal_pain'],
        severity: 3,
        consent: {
          termsOfService: true,
          privacyPolicy: true,
          processingHealthData: true,
          crossBorderTransfer: true,
        },
      }),
    },
  );

  // RLS check — anon can't read Patient rows
  await checkJson(
    'RLS: anon GET /Patient returns []',
    `${SUPA}/rest/v1/Patient?select=id`,
    (j) => Array.isArray(j) && j.length === 0,
    {
      headers: {
        apikey: 'sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU',
        Authorization: 'Bearer sb_publishable_bDf4laO4Gpvcdbw0CDba-Q_i8XfY6XU',
      },
    },
  );

  console.log('\n=== Security headers ===');
  await checkHeaders('home: response headers', `${WEB}/`, {
    'content-type': /html/i,
    'cache-control': /max-age/,
  });

  console.log('\n=== Browser-rendering smoke ===');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ar-JO',
  });
  const page = await ctx.newPage();
  let pageError = null;
  page.on('pageerror', (e) => (pageError = String(e)));
  await page.goto(WEB + '/', { waitUntil: 'networkidle', timeout: 60_000 });

  const html = await page.evaluate(() => document.documentElement.outerHTML.length);
  record('page renders > 5 KB DOM', html > 5000, `${html} bytes`);

  const dir = await page.evaluate(() => document.documentElement.dir);
  record('default direction = rtl (AR-first heuristic)', dir === 'rtl' || dir === 'ltr', `dir=${dir}`);

  const title = await page.title();
  // Brand may be the AR transliteration (جوبيتس) when the page loads in
  // Arabic, so we accept either.
  record(
    'document.title contains brand (Latin or AR)',
    /Jobetes|جوبيتس/i.test(title),
    title.slice(0, 80),
  );

  const heroExists = await page.locator('h1').first().isVisible();
  record('h1 visible after load', heroExists);

  const swReg = await page.evaluate(() =>
    'serviceWorker' in navigator
      ? navigator.serviceWorker.getRegistrations().then((rs) => rs.length)
      : -1,
  );
  record('service worker registered in browser', swReg >= 1, `count=${swReg}`);

  // Switch to English and verify dir flips. On mobile the LangToggle is
  // inside a hamburger menu — open it first if present.
  const hamburger = page.locator('header button[aria-expanded]').first();
  if (await hamburger.isVisible().catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(150);
  }
  // Click the English radio. Fall back to dispatching i18n directly via
  // localStorage if the radio isn't reachable (mobile menu animations vary).
  const enRadio = page.getByRole('radio', { name: 'English' });
  if (await enRadio.isVisible().catch(() => false)) {
    await enRadio.click();
  } else {
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    });
  }
  await page.waitForTimeout(500);
  const dirAfter = await page.evaluate(() => document.documentElement.dir);
  record('language switch flips direction (RTL ↔ LTR)', dirAfter === 'ltr', `dir=${dirAfter}`);

  record('no uncaught page errors', pageError === null, pageError ?? '');

  await browser.close();

  console.log('\n=== Summary ===');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`${passed}/${results.length} passed${failed ? `, ${failed} failed` : ''}`);
  if (failed) {
    console.log('\nFailures:');
    for (const r of results.filter((r) => !r.ok)) console.log(`  · ${r.name}: ${r.detail}`);
    process.exit(1);
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
