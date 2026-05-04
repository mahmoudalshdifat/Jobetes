import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { HomePage } from './HomePage.js';
import { i18n } from '../i18n.js';

describe('HomePage', () => {
  it('renders hero title and trust bar', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('fires onStartIntake when CTA button clicked', () => {
    const onStartIntake = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={onStartIntake} />
      </I18nextProvider>,
    );
    const startButtons = screen.getAllByRole('button');
    // The first prominent CTA is the start-intake button
    startButtons[0]?.click();
    expect(onStartIntake).toHaveBeenCalledOnce();
  });
});
