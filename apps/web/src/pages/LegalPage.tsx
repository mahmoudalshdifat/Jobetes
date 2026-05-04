import { useTranslation } from 'react-i18next';
import { Card } from '@jobetes/ui';

export function LegalPage(): JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="container-reading py-12 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{t('nav.legal')}</h1>
      <Card title={t('nav.privacy')}>
        <p className="text-ink-soft">
          See <a className="text-brand-primary underline" href="/legal/privacy.html">/legal/privacy</a>.
        </p>
      </Card>
      <Card title={t('nav.terms')}>
        <p className="text-ink-soft">
          See <a className="text-brand-primary underline" href="/legal/terms.html">/legal/terms</a>.
        </p>
      </Card>
      <Card title={t('nav.imprint')}>
        <address className="not-italic text-ink-soft">
          Dr. Mahmoud Al-Shdaifat<br />
          St. Anna Hospital Herne — Klinik für Gastroenterologie<br />
          Hospitalstraße 19, 44649 Herne, Deutschland<br />
          <a className="text-brand-primary underline" href="mailto:wanderwellcare@gmail.com">
            wanderwellcare@gmail.com
          </a>
        </address>
      </Card>
    </section>
  );
}
