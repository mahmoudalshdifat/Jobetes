#!/usr/bin/env node
/**
 * Performance budget enforcement.
 *
 * Reads `apps/web/dist/assets/*` and asserts that the gzipped initial bundle
 * (HTML + CSS + the chunks loaded by index.html) stays under a hard budget.
 * Fails CI if exceeded — keeping the patient-facing app snappy on Jordanian
 * 4G.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const BUDGET = {
  initialGzipKB: 130, // total of html + css + js initial chunks
  individualChunkGzipKB: 60,
};

async function gzipKB(path) {
  const buf = await readFile(path);
  return gzipSync(buf).length / 1024;
}

async function main() {
  const html = await gzipKB(join(DIST, 'index.html'));
  const assetsDir = join(DIST, 'assets');
  const entries = await readdir(assetsDir);

  const sizes = await Promise.all(
    entries
      .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
      .map(async (f) => {
        const p = join(assetsDir, f);
        const s = await stat(p);
        return { f, raw: s.size / 1024, gz: await gzipKB(p) };
      }),
  );

  const initial = html + sizes.reduce((acc, s) => acc + s.gz, 0);

  console.log('asset                                   raw KB   gz KB');
  console.log('----------------------------------------------------- ');
  console.log(`index.html                              n/a      ${html.toFixed(2)}`);
  for (const s of sizes) {
    console.log(`${s.f.padEnd(40)}${s.raw.toFixed(2).padStart(8)} ${s.gz.toFixed(2).padStart(7)}`);
  }
  console.log(`-----`);
  console.log(`initial gzip:    ${initial.toFixed(2)} KB  (budget ${BUDGET.initialGzipKB} KB)`);

  let failed = false;
  if (initial > BUDGET.initialGzipKB) {
    console.error(`✖ initial gzip exceeds budget by ${(initial - BUDGET.initialGzipKB).toFixed(2)} KB`);
    failed = true;
  }
  for (const s of sizes) {
    if (s.gz > BUDGET.individualChunkGzipKB) {
      console.error(
        `✖ ${s.f} (${s.gz.toFixed(2)} KB gz) exceeds per-chunk budget of ${BUDGET.individualChunkGzipKB} KB`,
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
