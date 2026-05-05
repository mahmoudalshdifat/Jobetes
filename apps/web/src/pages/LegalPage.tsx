import { useTranslation } from 'react-i18next';
import { Card } from '@jobetes/ui';

export function LegalPage(): JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="container-reading py-12 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.legal')}</h1>

      {/* Privacy Policy */}
      <Card title={t('nav.privacy')}>
        <div className="space-y-3 text-sm text-ink-soft">
          <p>{t('legal.privacy.controller')}</p>
          <p>{t('legal.privacy.purpose')}</p>
          <p>{t('legal.privacy.basis')}</p>
          <p>{t('legal.privacy.retention')}</p>
          <p>{t('legal.privacy.rights')}</p>
          <p className="text-xs text-ink-soft/70 border-t border-ink-strong/10 pt-3">
            {t('legal.placeholder.notice')}
          </p>
        </div>
      </Card>

      {/* Terms of Service */}
      <Card title={t('nav.terms')}>
        <div className="space-y-3 text-sm text-ink-soft">
          <p>{t('legal.terms.scope')}</p>
          <p>{t('legal.terms.nodiagnosis')}</p>
          <p>{t('legal.terms.liability')}</p>
          <p>{t('legal.terms.governing')}</p>
          <p className="text-xs text-ink-soft/70 border-t border-ink-strong/10 pt-3">
            {t('legal.placeholder.notice')}
          </p>
        </div>
      </Card>

      {/* Imprint / Impressum */}
      <Card title={t('nav.imprint')}>
        <address className="not-italic text-sm text-ink-soft space-y-1">
          <p className="font-medium text-ink-strong">Dr. Mahmoud Al-Shdaifat</p>
          <p>{t('legal.imprint.title')}</p>
          <p>St. Anna Hospital Herne</p>
          <p>Hospitalstraße 19, 44649 Herne, Deutschland</p>
          <p>
            <a
              className="text-brand-primary underline"
              href={`mailto:${t('legal.imprint.email')}`}
            >
              {t('legal.imprint.email')}
            </a>
          </p>
          <p className="pt-2 text-xs">{t('legal.imprint.disclaimer')}</p>
        </address>
      </Card>
    </section>
  );
}
