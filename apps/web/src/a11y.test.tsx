import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import axe from 'axe-core';
import { App } from './App.js';
import { i18n } from './i18n.js';

/**
 * jsdom-based a11y check. Catches a subset of issues that a real browser
 * would catch (Playwright + axe handles the full set in e2e). This runs
 * fast and gates regressions on every test run.
 */
describe('a11y', () => {
  it('App renders with zero critical/serious axe violations (jsdom)', async () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>,
    );

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (blocking.length > 0) {
      console.error(JSON.stringify(blocking, null, 2));
    }
    expect(blocking).toEqual([]);
  });
});
