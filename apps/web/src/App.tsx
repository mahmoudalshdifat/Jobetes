import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmergencyBanner, LangToggle } from '@jobetes/ui';
import type { Locale } from '@jobetes/shared-schemas';
import { HomePage } from './pages/HomePage.js';
import { DoctorPage } from './pages/DoctorPage.js';
import { IntakePage } from './pages/IntakePage.js';
import { LegalPage } from './pages/LegalPage.js';

type Route = 'home' | 'doctor' | 'intake' | 'legal';

export function App(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [route, setRoute] = useState<Route>('home');

  return (
    <div className="min-h-screen bg-surface-warm">
      <EmergencyBanner message={t('emergency.banner')} />

      <header className="border-b border-ink-strong/10 bg-surface-white/80 backdrop-blur">
        <div className="container-reading flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="text-lg font-semibold tracking-tight text-brand-primary"
          >
            {t('brand.name')}
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <button type="button" onClick={() => setRoute('doctor')} className="px-2 py-1">
              {t('nav.doctor')}
            </button>
            <button type="button" onClick={() => setRoute('intake')} className="px-2 py-1">
              {t('nav.intake')}
            </button>
            <button type="button" onClick={() => setRoute('legal')} className="px-2 py-1">
              {t('nav.legal')}
            </button>
            <LangToggle
              current={i18n.resolvedLanguage as Locale}
              onChange={(loc) => void i18n.changeLanguage(loc)}
              label={t('lang.toggle')}
            />
          </nav>
        </div>
      </header>

      <main>
        {route === 'home' ? <HomePage onStartIntake={() => setRoute('intake')} /> : null}
        {route === 'doctor' ? <DoctorPage /> : null}
        {route === 'intake' ? <IntakePage /> : null}
        {route === 'legal' ? <LegalPage /> : null}
      </main>

      <footer className="mt-16 border-t border-ink-strong/10 bg-surface-white py-8 text-center text-sm text-ink-soft">
        <div className="container-reading">{t('footer.copyright')}</div>
      </footer>
    </div>
  );
}
