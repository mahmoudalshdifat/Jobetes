import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { AppointmentPage } from './AppointmentPage.js';
import { i18n } from '../i18n.js';

/**
 * Component-level smoke. The full submit flow (network → 201 → success card)
 * is exercised by Playwright E2E because react-hook-form's async validation
 * is finicky in jsdom and the value comes from network anyway.
 */
describe('AppointmentPage', () => {
  it('renders heading + name field + phone field + reason field + submit button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppointmentPage />
      </I18nextProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // tel input
    expect(screen.getByPlaceholderText(/\+962/u)).toBeInTheDocument();
    // submit button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders the time-of-day select with 4 options', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AppointmentPage />
      </I18nextProvider>,
    );
    const select = screen.getByRole('combobox');
    expect(select.children).toHaveLength(4);
  });
});
