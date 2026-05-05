import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { IntakePage } from './IntakePage.js';
import { i18n } from '../i18n.js';

describe('IntakePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch);
  });

  it('navigates all intake steps with next/back controls', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <IntakePage />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { level: 2, name: /who you are/i })).toBeInTheDocument();
    const backButton = screen.getByRole('button', { name: '←' });
    expect(backButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(screen.getByRole('heading', { level: 2, name: /what's going on/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(screen.getByRole('heading', { level: 2, name: /cultural context/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(screen.getByRole('heading', { level: 2, name: /your consent/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(screen.getByRole('heading', { level: 2, name: /review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit intake/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '←' }));
    expect(screen.getByRole('heading', { level: 2, name: /your consent/i })).toBeInTheDocument();
  });

  it('submits valid intake and shows success card', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

    render(
      <I18nextProvider i18n={i18n}>
        <IntakePage />
      </I18nextProvider>,
    );

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Aya' } });
    fireEvent.change(screen.getByLabelText(/family name/i), { target: { value: 'Khaled' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByPlaceholderText(/\+962/u), { target: { value: '+962790000000' } });

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });

    const symptomsSelect = screen.getByRole('listbox');
    const option = screen.getByRole('option', { name: /abdominal pain/i });
    (option as HTMLOptionElement).selected = true;
    fireEvent.change(symptomsSelect);

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    fireEvent.click(screen.getByRole('button', { name: '→' }));

    fireEvent.click(screen.getByLabelText(/terms of service/i));
    fireEvent.click(screen.getByLabelText(/privacy policy/i));
    fireEvent.click(screen.getByLabelText(/processing of my health data/i));
    fireEvent.click(screen.getByLabelText(/data may be processed in germany/i));

    fireEvent.click(screen.getByRole('button', { name: '→' }));
    fireEvent.click(screen.getByRole('button', { name: /submit intake/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/intake', expect.objectContaining({ method: 'POST' }));
      expect(screen.getByText(/thank you\. the clinic will contact you shortly\./i)).toBeInTheDocument();
    });
  });
});
