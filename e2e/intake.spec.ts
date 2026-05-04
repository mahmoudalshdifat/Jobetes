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
