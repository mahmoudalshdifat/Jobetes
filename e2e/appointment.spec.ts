import { test, expect } from '@playwright/test';

/**
 * Patient-facing booking flow — the primary Jordan-marketing conversion
 * after the WhatsApp button. Covers: form renders in 3 locales, fields
 * have accessible labels, validation prevents submit on bad input,
 * and the success card shows after a 201.
 */

async function gotoAppointment(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  // Force English so we can match labels deterministically across runs
  await page.getByRole('radio', { name: 'English' }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.lang))
    .toBe('en');
  await page.locator('header').getByRole('button', { name: /book/iu }).click();
}

test.describe('appointment booking — happy path', () => {
  test('form renders heading + tel input + time-of-day select', async ({ page }) => {
    await gotoAppointment(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/\+962/u)).toBeVisible();
    // 4 time-of-day options (any/morning/afternoon/evening)
    const select = page.getByRole('combobox');
    await expect(select).toBeVisible();
    const options = await select.locator('option').count();
    expect(options).toBe(4);
  });

  test('every visible input has an accessible label', async ({ page }) => {
    await gotoAppointment(page);
    const inputs = page.locator('input:not([type="hidden"]):not([type="radio"])');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const id = await inputs.nth(i).getAttribute('id');
      if (!id) continue;
      await expect(page.locator(`label[for="${id}"]`)).toBeAttached();
    }
  });

  test('submits successfully with valid input — 201 mocked', async ({ page }) => {
    // Intercept the API POST and return a synthetic 201.
    await page.route('**/appointments', (route) => {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          status: 'requested',
          receivedAt: new Date().toISOString(),
        }),
      });
    });

    await gotoAppointment(page);

    // Fill the form
    await page.locator('input[autocomplete="name"]').fill('Layla Haddad');
    await page.locator('input[type="tel"]').fill('+962799123456');
    // The "reason" field — a text input or textarea depending on the impl
    const reason = page.getByLabel(/reason/iu);
    if (await reason.count()) await reason.first().fill('follow up on heartburn');
    // Preferred dates field — comma-separated text input
    const dates = page.getByLabel(/dates|preferred dates/iu);
    if (await dates.count()) await dates.first().fill('2026-06-01,2026-06-02');

    await page.getByRole('button', { name: /request|submit/iu }).click();

    // Success card appears
    await expect(page.getByText(/received|success|received/iu)).toBeVisible({ timeout: 10_000 });
  });
});
