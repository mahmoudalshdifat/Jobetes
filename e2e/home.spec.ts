import { test, expect } from '@playwright/test';

async function openMobileMenuIfNeeded(page: any) {
  const menuBtn = page.locator('header button[aria-expanded]');
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
  }
}

test.describe('home page — first-load trust signals', () => {
  test('shows brand, hero, language toggle and emergency banner', async ({ page }) => {
    await page.goto('/');

    // Brand visible (in any locale).
    await expect(page.locator('header').first()).toContainText(/Jobetes|جوبيتس/u);

    // Emergency banner is non-negotiable — must be visible at first paint.
    await expect(page.getByRole('note')).toContainText(/911|112|طوارئ|Notfall|emergency/iu);

    // The three language radios from LangToggle (may be inside mobile menu).
    await openMobileMenuIfNeeded(page);
    await expect(page.getByRole('radio', { name: 'العربية' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'English' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Deutsch' })).toBeVisible();
  });

  test('language switch changes the html dir attribute (RTL ↔ LTR)', async ({ page }) => {
    await page.goto('/');

    await openMobileMenuIfNeeded(page);
    await page.getByRole('radio', { name: 'English' }).click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.dir)).toBe('ltr');
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe('en');

    await openMobileMenuIfNeeded(page);
    await page.getByRole('radio', { name: 'العربية' }).click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe('ar');
  });
});
