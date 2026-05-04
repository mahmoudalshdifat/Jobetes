import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { HomePage } from './HomePage.js';
import { i18n } from '../i18n.js';

describe('HomePage', () => {
  it('renders the hero heading and the badge', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the 3-step "How it works" section', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('fires onStartIntake from the primary CTA', () => {
    const onStartIntake = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={onStartIntake} />
      </I18nextProvider>,
    );
    const startButtons = screen.getAllByRole('button');
    startButtons[0]?.click();
    expect(onStartIntake).toHaveBeenCalledOnce();
  });

  it('links to the verifiable hospital page', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('annahospital.de'));
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
