import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { DoctorPage } from './DoctorPage.js';
import { i18n } from '../i18n.js';

const fetchMock = vi.fn();

describe('DoctorPage', () => {
  beforeEach(async () => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders doctor profile on successful API response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        fullName: 'Dr. Mahmoud Al-Shdaifat',
        title: 'Senior physician',
        hospital: 'St. Anna Hospital Herne',
        hospitalUrl: 'https://www.annahospital.de',
        city: 'Herne',
        countryCode: 'DE',
        languages: ['ar', 'de', 'en'],
        credentials: [{ label: 'Facharzt Innere Medizin' }],
        specialties: ['Gastroenterology'],
        bio: {
          ar: 'bio ar',
          de: 'bio de',
          en: 'bio en',
        },
      }),
    });

    render(
      <I18nextProvider i18n={i18n}>
        <DoctorPage />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Mahmoud Al-Shdaifat')).toBeInTheDocument();
    });
  });

  it('renders alert on API error', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    render(
      <I18nextProvider i18n={i18n}>
        <DoctorPage />
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/http 500/i);
    });
  });
});
