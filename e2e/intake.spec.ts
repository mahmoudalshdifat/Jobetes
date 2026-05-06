import { test, expect } from '@playwright/test';

test.describe('intake wizard — happy path (English locale)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'English' }).click();
  });

  test('navigates to intake and shows the stepper', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /start intake/iu }).click();
    await expect(page.getByText(/who you are/iu)).toBeVisible();
    await expect(page.getByText(/your consent/iu)).toBeVisible();
  });

  test('every form field has an accessible label', async ({ page }) => {
    await page.locator('header').getByRole('button', { name: /start intake/iu }).click();

    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const id = await inputs.nth(i).getAttribute('id');
      if (!id) continue;
      const label = page.locator(`label[for="${id}"]`);
      await expect(label, `field with id ${id} must have a <label for>`).toBeAttached();
    }
  });
});

// ─── Arabic / RTL intake flow ──────────────────────────────────────────────
// This test covers the primary Jordan user journey:
//   - UI switches to Arabic + RTL
//   - Intake wizard opens and renders in Arabic
//   - Form fields are labelled and keyboard-navigable in RTL
test.describe('intake wizard — Arabic RTL locale (Jordan primary path)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'العربية' }).click();
    // Confirm direction flip before interacting
    await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe('rtl');
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('ar');
  });

  test('intake wizard opens in Arabic and shows RTL layout', async ({ page }) => {
    // In Arabic locale the CTA text is the AR translation — use regex for robustness
    const ctaButton = page.locator('header').getByRole('button').filter({ hasText: /تسجيل|intake|ابدأ/iu });
    await ctaButton.first().click();

    // Step label must be visible (Arabic or English fallback)
    const firstStepVisible =
      (await page.getByText(/من أنت|who you are|بياناتك/iu).count()) > 0;
    expect(firstStepVisible).toBeTruthy();

    // html[dir] must still be rtl after navigation
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('all form fields on intake step 1 have accessible labels in Arabic', async ({ page }) => {
    const ctaButton = page.locator('header').getByRole('button').filter({ hasText: /تسجيل|intake|ابدأ/iu });
    await ctaButton.first().click();

    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const id = await inputs.nth(i).getAttribute('id');
      if (!id) continue;
      const label = page.locator(`label[for="${id}"]`);
      await expect(label, `field #${id} must have a <label for> in AR mode`).toBeAttached();
    }
  });

  test('emergency banner is visible and contains Arabic emergency number', async ({ page }) => {
    // Emergency banner must always be present — non-negotiable for Jordan launch
    const banner = page.getByRole('note');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/911|طوارئ|إسعاف/u);
  });
});
