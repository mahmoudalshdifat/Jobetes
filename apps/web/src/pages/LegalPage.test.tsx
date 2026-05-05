import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { LegalPage } from './LegalPage.js';
import { i18n } from '../i18n.js';

describe('LegalPage', () => {
  it('renders privacy, terms and imprint sections', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <LegalPage />
      </I18nextProvider>,
    );
    expect(screen.getByRole('heading', { name: /privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /terms/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /imprint/i })).toBeInTheDocument();
  });
});
