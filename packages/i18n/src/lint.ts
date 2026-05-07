import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { resources } from './index.js';

/**
 * Static i18n linter. Walks a source tree, extracts every literal-string
 * argument to `t('...')` calls, and returns the set of keys that are
 * referenced but missing from `en/common.json`.
 *
 * Intentionally simple: only catches `t('literal-string')`. Dynamic keys
 * (`t(varName)`, `t(\`${prefix}.foo\`)`) are skipped — they're flagged
 * separately as "dynamic-key" usages so the maintainer can audit them.
 */

export type LintResult = {
  /** keys referenced in source but missing from en/common.json */
  missingKeys: string[];
  /** keys defined in en/common.json but never referenced in source */
  orphanKeys: string[];
  /** files that use t(varName) — caller's responsibility to verify */
  dynamicKeyUsages: { file: string; line: number; snippet: string }[];
};

// Catches t('static.key') — but NOT t(`prefix.${var}`) which contain ${…}.
// We treat any backtick-string with ${ as dynamic (skipped here, recorded separately).
const T_LITERAL = /\bt\s*\(\s*['"`]([^'"`$]+)['"`]/g;
const T_DYNAMIC = /\bt\s*\(\s*(?:[A-Za-z_$][\w$.]*\s*[,)]|`[^`]*\$\{)/g;

export async function lintI18n(srcRoots: string[]): Promise<LintResult> {
  const referenced = new Set<string>();
  const dynamicKeyUsages: LintResult['dynamicKeyUsages'] = [];

  for (const root of srcRoots) {
    for await (const file of walk(root)) {
      if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
      const content = await readFile(file, 'utf8');
      for (const match of content.matchAll(T_LITERAL)) {
        if (match[1]) referenced.add(match[1]);
      }
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (T_DYNAMIC.test(line) && !T_LITERAL.test(line)) {
          dynamicKeyUsages.push({ file: relative(process.cwd(), file), line: idx + 1, snippet: line.trim() });
        }
      });
    }
  }

  const defined = new Set(Object.keys(resources.en.common));
  const missingKeys = [...referenced].filter((k) => !defined.has(k)).sort();
  const orphanKeys = [...defined].filter((k) => !referenced.has(k)).sort();

  return { missingKeys, orphanKeys, dynamicKeyUsages };
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}
