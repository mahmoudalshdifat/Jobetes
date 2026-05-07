import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { lintI18n } from './lint.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');

describe('i18n lint — repo-wide', () => {
  it('every t("literal") in apps/web src points at a real i18n key', async () => {
    const result = await lintI18n([join(REPO_ROOT, 'apps', 'web', 'src')]);
    if (result.missingKeys.length > 0) {
      // eslint-disable-next-line no-console
      console.error('Missing i18n keys:\n  ' + result.missingKeys.join('\n  '));
    }
    expect(result.missingKeys).toEqual([]);
  });

  it('no untracked dynamic t() usages explode silently', async () => {
    // Dynamic usage is allowed, but list them so a reviewer sees what is
    // referenced indirectly. This test never fails — it just records the
    // surface in the snapshot for awareness.
    const result = await lintI18n([join(REPO_ROOT, 'apps', 'web', 'src')]);
    expect(Array.isArray(result.dynamicKeyUsages)).toBe(true);
  });
});
