#!/usr/bin/env node
/**
 * Performance budget enforcement.
 *
 * Reads `apps/web/dist/index.html` to discover which asset files are
 * referenced directly (initial load), then checks:
 *   1. Total initial gzip ≤ BUDGET.initialGzipKB
 *   2. Each individual *initial* chunk gzip ≤ BUDGET.individualChunkGzipKB
 *   3. Each *lazy* chunk gzip ≤ BUDGET.lazyChunkGzipKB
 *   4. Total lazy gzip is informational + tracked against BUDGET.lazyTotalGzipKB
 *
 * The lazy budget catches accidental "import the world into one route"
 * regressions on slow networks (Jordan median fixed broadband ~30 Mbps,
 * mobile ~30 Mbps, but real-world JO 4G p50 is ~10 Mbps per nperf 2025).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const BUDGET = {
  initialGzipKB: 130,
  individualChunkGzipKB: 60,
  lazyChunkGzipKB: 30,
  lazyTotalGzipKB: 100,
};

async function gzipKB(path) {
  const buf = await readFile(path);
  return gzipSync(buf).length / 1024;
}

/** Parse index.html and return asset filenames that are loaded on first paint */
async function getInitialAssets(distPath) {
  const html = await readFile(join(distPath, 'index.html'), 'utf8');
  const initial = new Set();
  for (const m of html.matchAll(/\bsrc="[^"]*\/assets\/([^"]+\.js)"/g)) initial.add(m[1]);
  for (const m of html.matchAll(/\bhref="[^"]*\/assets\/([^"]+\.(js|css))"/g)) initial.add(m[1]);
  return initial;
}

async function main() {
  const htmlGz = await gzipKB(join(DIST, 'index.html'));
  const initialNames = await getInitialAssets(DIST);

  const assetsDir = join(DIST, 'assets');
  const entries = await readdir(assetsDir);

  const sizes = await Promise.all(
    entries
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .map(async (f) => {
        const p = join(assetsDir, f);
        const s = await stat(p);
        return { f, raw: s.size / 1024, gz: await gzipKB(p), initial: initialNames.has(f) };
      }),
  );

  const initialChunks = sizes.filter((s) => s.initial);
  const lazyChunks = sizes.filter((s) => !s.initial);
  const initialTotal = htmlGz + initialChunks.reduce((acc, s) => acc + s.gz, 0);
  const lazyTotal = lazyChunks.reduce((acc, s) => acc + s.gz, 0);

  console.log('asset                                       raw KB   gz KB  kind');
  console.log('---------------------------------------------------------------');
  console.log(`index.html                                  n/a      ${htmlGz.toFixed(2)}   initial`);
  for (const s of [...initialChunks, ...lazyChunks]) {
    const kind = s.initial ? 'initial' : 'lazy';
    console.log(
      `${s.f.padEnd(44)}${s.raw.toFixed(2).padStart(8)} ${s.gz.toFixed(2).padStart(7)}  ${kind}`,
    );
  }
  console.log('---');
  console.log(`initial gzip:    ${initialTotal.toFixed(2)} KB  (budget ${BUDGET.initialGzipKB})`);
  console.log(`lazy total:      ${lazyTotal.toFixed(2)} KB  (budget ${BUDGET.lazyTotalGzipKB})`);
  console.log(
    `largest lazy:    ${Math.max(0, ...lazyChunks.map((s) => s.gz)).toFixed(2)} KB  (per-chunk budget ${BUDGET.lazyChunkGzipKB})`,
  );

  let failed = false;
  if (initialTotal > BUDGET.initialGzipKB) {
    console.error(
      `✖ initial gzip exceeds budget by ${(initialTotal - BUDGET.initialGzipKB).toFixed(2)} KB`,
    );
    failed = true;
  }
  if (lazyTotal > BUDGET.lazyTotalGzipKB) {
    console.error(
      `✖ lazy total gzip exceeds budget by ${(lazyTotal - BUDGET.lazyTotalGzipKB).toFixed(2)} KB`,
    );
    failed = true;
  }
  for (const s of initialChunks) {
    if (s.gz > BUDGET.individualChunkGzipKB) {
      console.error(
        `✖ initial chunk ${s.f} (${s.gz.toFixed(2)} KB gz) exceeds per-chunk budget of ${BUDGET.individualChunkGzipKB} KB`,
      );
      failed = true;
    }
  }
  for (const s of lazyChunks) {
    if (s.gz > BUDGET.lazyChunkGzipKB) {
      console.error(
        `✖ lazy chunk ${s.f} (${s.gz.toFixed(2)} KB gz) exceeds lazy-chunk budget of ${BUDGET.lazyChunkGzipKB} KB`,
      );
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log('✓ bundle within budget');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
