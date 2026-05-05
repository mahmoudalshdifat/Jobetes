import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, JordanCallout, TrustBar, WhatsAppButton } from '@jobetes/ui';

const HomePageBelowFold = lazy(() =>
  import('./HomePageBelowFold.js').then((m) => ({ default: m.HomePageBelowFold })),
);

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

/**
 * Patient marketing landing for Jordan. Hero → why-German → how-it-works
 * → testimonials → FAQ → family-access → closing CTA. WhatsApp button is
 * a primary conversion path (96 % JO adoption per DataReportal 2025).
 *
 * Below-fold sections (WhyGerman, how-it-works, Testimonials, FAQ, CTA) are
 * lazy-loaded so the initial JS chunk stays small.
 */
export function HomePage({ onStartIntake }: { onStartIntake: () => void }): JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      {/* Jordan-specific callout for non-Arabic visitors */}
      <JordanCallout
        title={t('jordan.welcome.title')}
        body={t('jordan.welcome.body')}
        cta={{ label: t('jordan.welcome.cta') }}
      />

      <section className="container-reading py-12 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-secondary">
              <span aria-hidden className="size-1.5 rounded-full bg-brand-secondary" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink-strong sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-prose text-lg text-ink-soft">{t('hero.subtitle')}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onStartIntake}>
                {t('hero.cta.start')}
              </Button>
              <WhatsAppButton
                phone={WHATSAPP_NUMBER}
                message={t('jordan.welcome.body')}
                label={t('whatsapp.cta')}
                sublabel={t('whatsapp.cta.sub')}
              />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-olive/15 px-3 py-1 text-sm font-medium text-accent-olive">
              <span aria-hidden>✓</span>
              {t('free.first.consult.badge')}
            </div>

            <TrustBar
              className="mt-10 justify-start"
              items={[
                { label: t('trust.privacyByDesign'), icon: '🛡' },
                { label: t('trust.realDoctor'), icon: '✓' },
                { label: t('trust.noDiagnosisDisclaimer'), icon: 'ⓘ' },
              ]}
            />
          </div>

          <Card
            className="lg:max-w-md lg:justify-self-end"
            title={t('home.doctorCard.title')}
            description={t('home.doctorCard.subtitle')}
          >
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {t('doctor.credentials')}
                </dt>
                <dd className="mt-1 space-y-1.5">
                  <p>{t('doctor.credentials.specialty')}</p>
                  <p>{t('doctor.credentials.diabetology')}</p>
                  <p>{t('doctor.credentials.emergency')}</p>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {t('doctor.languages')}
                </dt>
                <dd className="mt-1 font-medium">العربية · Deutsch · English</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {t('home.doctorCard.hospital')}
                </dt>
                <dd className="mt-1 font-medium">St. Anna Hospital Herne, Deutschland</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <Suspense fallback={null}>
        <HomePageBelowFold onStartIntake={onStartIntake} />
      </Suspense>
    </div>
  );
}
