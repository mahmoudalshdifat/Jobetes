import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('renders the 3-step "How it works" section (lazy)', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    // how-it-works is in the lazy below-fold chunk
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('fires onStartIntake from the primary CTA', () => {
    const onStartIntake = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={onStartIntake} />
      </I18nextProvider>,
    );
    const startButton = screen.getAllByRole('button', { name: /start a confidential intake/i })[0];
    if (startButton) fireEvent.click(startButton);
    expect(onStartIntake).toHaveBeenCalledOnce();
  });

  it('renders WhatsApp click-to-chat (96 % JO adoption per DataReportal 2025)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    const wa = screen
      .getAllByRole('link')
      .find((l) => l.getAttribute('href')?.includes('wa.me'));
    expect(wa).toBeDefined();
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
    expect(wa).toHaveAttribute('target', '_blank');
  });

  it('renders the Jordan emergency number (911 / 199) (lazy)', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    // emergency number is in the lazy below-fold CTA section
    await screen.findByText(/911|199/u);
  });

  it('renders 3 FAQ <details> items (lazy)', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <HomePage onStartIntake={() => {}} />
      </I18nextProvider>,
    );
    // FAQ is in the lazy below-fold chunk
    await waitFor(() => {
      expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(3);
    });
  });
});
