import { useTranslation } from 'react-i18next';
import { Button, Card, Faq, WhatsAppButton, WhyGerman } from '@jobetes/ui';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

/**
 * Below-the-fold sections of the HomePage.
 * Loaded as a separate lazy chunk — not needed for first paint.
 */
export function HomePageBelowFold({
  onStartIntake,
}: {
  onStartIntake: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <WhyGerman
        title={t('why.german.title')}
        body={t('why.german.body')}
        bullets={[t('why.german.bullet1'), t('why.german.bullet2'), t('why.german.bullet3')]}
      />

      <section className="border-y border-ink-strong/5 bg-surface-warm">
        <div className="container-reading py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">
            {t('home.how.title')}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {(
              [
                { step: '1', title: t('home.how.step1.title'), body: t('home.how.step1.body') },
                { step: '2', title: t('home.how.step2.title'), body: t('home.how.step2.body') },
                { step: '3', title: t('home.how.step3.title'), body: t('home.how.step3.body') },
              ] as const
            ).map((s) => (
              <li key={s.step} className="rounded-3xl bg-surface-white p-6 shadow-sm">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-primary text-base font-semibold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink-strong">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-reading py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">{t('testimonials.title')}</h2>
        <p className="mt-4 text-ink-soft">{t('testimonials.comingSoon')}</p>
      </section>

      <Faq
        title={t('faq.title')}
        items={[
          { q: t('faq.q1'), a: t('faq.a1') },
          { q: t('faq.q2'), a: t('faq.a2') },
          { q: t('faq.q3'), a: t('faq.a3') },
        ]}
      />

      <section className="container-reading pb-16">
        <Card
          title={t('family.access.title')}
          description={t('family.access.body')}
          className="border-brand-secondary/20 bg-brand-secondary/5"
        />
      </section>

      <section className="container-reading pb-20">
        <div className="rounded-3xl bg-brand-primary px-8 py-12 text-surface-white sm:px-12">
          <h2 className="max-w-prose text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('home.cta.title')}
          </h2>
          <p className="mt-3 max-w-prose text-surface-warm/85">{t('home.cta.body')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" onClick={onStartIntake}>
              {t('hero.cta.start')}
            </Button>
            <WhatsAppButton
              phone={WHATSAPP_NUMBER}
              message={t('jordan.welcome.body')}
              label={t('home.schedule.cta')}
            />
          </div>
          <p className="mt-6 text-xs text-surface-warm/70">{t('emergency.jordan')}</p>
        </div>
      </section>
    </>
  );
}
