import { test, expect } from '@playwright/test';

/**
 * Visual-regression smoke for the patient marketing landing.
 *
 * We screenshot the hero region in 4 high-stakes states:
 *   - light mode + LTR English
 *   - light mode + RTL Arabic (Jordan primary)
 *   - dark mode + LTR English
 *   - dark mode + RTL Arabic
 *
 * Tolerance is generous (`maxDiffPixelRatio: 0.05`) — we are catching
 * accidental layout breakage and contrast regressions, not pixel-perfect
 * font rendering. Screenshots live in `e2e/__screenshots__/` and are
 * regenerated with `--update-snapshots`.
 */

async function freezeForScreenshot(page: import('@playwright/test').Page) {
  // Mask any time-based content (timestamps, etc.) and disable animations.
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }`,
  });
  // Wait for fonts so AR glyphs are stable
  await page.evaluate(() => document.fonts?.ready);
}

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('jobetes-theme', t);
  }, theme);
}

const LOCALES = [
  { code: 'en', name: 'English', dir: 'ltr' as const },
  { code: 'ar', name: 'العربية', dir: 'rtl' as const },
];
const THEMES = ['light', 'dark'] as const;

test.describe('hero — visual regression (LTR/RTL × light/dark)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await freezeForScreenshot(page);
  });

  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      test(`${locale.code} · ${theme}`, async ({ page }) => {
        await page.getByRole('radio', { name: locale.name }).first().click().catch(async () => {
          // Mobile: open the hamburger first
          const menuBtn = page.locator('header button[aria-expanded]');
          if (await menuBtn.isVisible().catch(() => false)) {
            await menuBtn.click();
            await page.getByRole('radio', { name: locale.name }).click();
          }
        });
        await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe(
          locale.dir,
        );
        await setTheme(page, theme);
        await expect.poll(() =>
          page.evaluate(() => document.documentElement.classList.contains('dark')),
        ).toBe(theme === 'dark');

        // Settle one frame for theme repaint
        await page.waitForTimeout(50);

        const hero = page.locator('main section').first();
        await expect(hero).toHaveScreenshot(`hero-${locale.code}-${theme}.png`, {
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
        });
      });
    }
  }
});
