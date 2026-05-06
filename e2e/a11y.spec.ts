import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/'];

for (const route of ROUTES) {
  test(`axe a11y on ${route} — zero critical or serious`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (blocking.length > 0) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(blocking, null, 2));
    }
    expect(blocking).toEqual([]);
  });
}

// ─── RTL / Arabic WCAG gate ──────────────────────────────────────────────────
// Jordan's primary locale is Arabic (RTL). This test switches the UI to Arabic
// and verifies that the direction flip does not introduce axe violations.
test('axe a11y in Arabic RTL mode — zero critical or serious', async ({ page }) => {
  await page.goto('/');
  // Switch to Arabic via the LangToggle
  await page.getByRole('radio', { name: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' }).click();
  // Wait for dir attribute to flip
  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe('rtl');
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('ar');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (blocking.length > 0) {
    // eslint-disable-next-line no-console
    console.error('RTL a11y violations:', JSON.stringify(blocking, null, 2));
  }
  expect(blocking).toEqual([]);
});

// ─── Intake page a11y ────────────────────────────────────────────────────────
test('axe a11y on intake page (English) — zero critical or serious', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'English' }).click();
  await page.locator('header').getByRole('button', { name: /start intake/iu }).click();
  await expect(page.getByText(/who you are/iu)).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (blocking.length > 0) {
    // eslint-disable-next-line no-console
    console.error('Intake page a11y violations:', JSON.stringify(blocking, null, 2));
  }
  expect(blocking).toEqual([]);
});
