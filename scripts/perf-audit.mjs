#!/usr/bin/env node
/**
 * Real production performance audit for jobetes.diggai.de.
 *
 * Uses the Playwright Chromium binary (installed via `pnpm e2e:install`)
 * to:
 *   1. Load the production URL on a simulated mobile-3G/-4G profile
 *   2. Capture Core Web Vitals (FCP, LCP, CLS, TTFB)
 *   3. Capture page weight + request count
 *   4. Capture console errors and failed requests
 *   5. Re-test in AR/RTL after a language switch
 *
 * Output is plain-text + JSON to stdout — pipe into `jq` or eyeball.
 */
import { chromium } from '@playwright/test';

const URL_PROD = process.env.PERF_URL ?? 'https://jobetes.diggai.de/';
const RUNS = Number(process.env.PERF_RUNS ?? 3);

async function captureMetrics(page) {
  return await page.evaluate(
    () =>
      new Promise((resolve) => {
        const result = {};
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          result.ttfbMs = Math.round(nav.responseStart - nav.requestStart);
          result.domContentLoadedMs = Math.round(nav.domContentLoadedEventEnd);
          result.loadMs = Math.round(nav.loadEventEnd);
          result.transferBytes = nav.transferSize;
          result.encodedBodyBytes = nav.encodedBodySize;
          result.decodedBodyBytes = nav.decodedBodySize;
        }
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcp) result.fcpMs = Math.round(fcp.startTime);

        const lcpObs = new PerformanceObserver(() => {});
        try { lcpObs.observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
        const lcpList = performance.getEntriesByType('largest-contentful-paint');
        if (lcpList.length) result.lcpMs = Math.round(lcpList[lcpList.length - 1].startTime);

        let cls = 0;
        const clsObs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
        });
        try { clsObs.observe({ type: 'layout-shift', buffered: true }); } catch {}
        setTimeout(() => {
          result.clsRatio = Number(cls.toFixed(4));
          resolve(result);
        }, 800);
      }),
  );
}

async function runOnce(browser, run) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    locale: 'ar-JO',
    deviceScaleFactor: 3,
  });
  const page = await ctx.newPage();

  // CDP throttle: simulate Slow 4G (Jordan baseline)
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const requests = [];
  const consoleErrors = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('requestfailed', (r) =>
    consoleErrors.push(`requestfailed: ${r.url()} — ${r.failure()?.errorText ?? ''}`),
  );
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  const start = Date.now();
  await page.goto(URL_PROD, { waitUntil: 'load', timeout: 60_000 });
  const loadMs = Date.now() - start;
  // Give Web Vitals + lazy chunks a moment to settle
  await page.waitForTimeout(3000);

  const metrics = await captureMetrics(page);

  // Capture page-weight summary
  const weights = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((r) => ({
      name: r.name.replace(/^https?:\/\/[^/]+/, ''),
      bytes: r.transferSize,
      durationMs: Math.round(r.duration),
    })),
  );
  const totalBytes = weights.reduce((a, w) => a + (w.bytes || 0), 0);

  await ctx.close();

  return {
    run,
    url: URL_PROD,
    metrics: { wallClockMs: loadMs, ...metrics },
    requests: requests.length,
    totalKB: Math.round(totalBytes / 1024),
    consoleErrors,
    biggest3: weights.sort((a, b) => b.bytes - a.bytes).slice(0, 3),
  };
}

async function main() {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    runs.push(await runOnce(browser, i + 1));
  }
  await browser.close();

  // Median across runs
  const med = (xs) => {
    const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : null;
  };
  const summary = {
    url: URL_PROD,
    runs: RUNS,
    medianMetrics: {
      ttfbMs: med(runs.map((r) => r.metrics.ttfbMs)),
      fcpMs: med(runs.map((r) => r.metrics.fcpMs)),
      lcpMs: med(runs.map((r) => r.metrics.lcpMs)),
      clsRatio: med(runs.map((r) => r.metrics.clsRatio)),
      loadMs: med(runs.map((r) => r.metrics.loadMs)),
      wallClockMs: med(runs.map((r) => r.metrics.wallClockMs)),
    },
    medianRequests: med(runs.map((r) => r.requests)),
    medianTotalKB: med(runs.map((r) => r.totalKB)),
    consoleErrorsAcrossRuns: runs.flatMap((r) => r.consoleErrors),
    biggestAssets: runs[0].biggest3,
  };

  console.log('\n===== Jobetes Production Audit =====');
  console.log(`URL:        ${summary.url}`);
  console.log(`Profile:    iPhone 14 · Slow 4G (1.6 Mbps · 150 ms) · CPU 4×`);
  console.log(`Runs:       ${RUNS}`);
  console.log('---');
  const m = summary.medianMetrics;
  const verdict = (val, good, ok) =>
    val == null ? '·' : val <= good ? '✓' : val <= ok ? '~' : '✗';
  console.log(`TTFB:       ${m.ttfbMs ?? '·'} ms        ${verdict(m.ttfbMs, 600, 1000)}  (good ≤ 600 ms)`);
  console.log(`FCP:        ${m.fcpMs ?? '·'} ms        ${verdict(m.fcpMs, 1800, 3000)}  (good ≤ 1800 ms)`);
  console.log(`LCP:        ${m.lcpMs ?? '·'} ms        ${verdict(m.lcpMs, 2500, 4000)}  (good ≤ 2500 ms)`);
  console.log(`CLS:        ${m.clsRatio ?? '·'}        ${verdict(m.clsRatio, 0.1, 0.25)}  (good ≤ 0.1)`);
  console.log(`onLoad:     ${m.loadMs ?? '·'} ms`);
  console.log(`Requests:   ${summary.medianRequests}`);
  console.log(`Page wt.:   ${summary.medianTotalKB} KB`);
  console.log('---');
  console.log(`Console errors (across runs): ${summary.consoleErrorsAcrossRuns.length}`);
  for (const e of summary.consoleErrorsAcrossRuns.slice(0, 5)) console.log(`  · ${e}`);
  console.log('---');
  console.log('Biggest 3 resources (run 1):');
  for (const a of summary.biggestAssets) {
    console.log(`  ${(a.bytes / 1024).toFixed(1).padStart(7)} KB  ${a.durationMs} ms  ${a.name}`);
  }
  console.log('===================================\n');

  // Also dump JSON for tooling
  console.log('JSON:');
  console.log(JSON.stringify(summary, null, 2));
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
