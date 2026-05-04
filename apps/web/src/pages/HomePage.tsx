import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Faq,
  TrustBar,
  Testimonials,
  WhatsAppButton,
  WhyGerman,
} from '@jobetes/ui';

const WHATSAPP_NUMBER = '+4923231234567'; // placeholder — replace with clinic WA on launch

/**
 * Patient marketing landing for Jordan. Hero → why-German → how-it-works
 * → testimonials → FAQ → family-access → closing CTA. WhatsApp button is
 * a primary conversion path (96 % JO adoption per DataReportal 2025).
 */
export function HomePage({ onStartIntake }: { onStartIntake: () => void }): JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      <section className="container-reading py-12 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-secondary">
              <span aria-hidden className="size-1.5 rounded-full bg-brand-secondary" />
              {t('hero.badge', { defaultValue: 'Tele-Gastroenterologie' })}
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
            title={t('home.doctorCard.title', { defaultValue: 'Ihr Arzt' })}
            description={t('home.doctorCard.subtitle', {
              defaultValue: 'Verifizierter Oberarzt — direkt aus der Klinik',
            })}
          >
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {t('doctor.credentials')}
                </dt>
                <dd className="mt-1 space-y-1.5">
                  <p>Facharzt für Innere Medizin & Gastroenterologie</p>
                  <p>Diabetologe DDG / ÄKWL</p>
                  <p>Notfallmedizin · Wundtherapie ICW</p>
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
                  {t('home.doctorCard.hospital', { defaultValue: 'Klinik' })}
                </dt>
                <dd className="mt-1 font-medium">St. Anna Hospital Herne, Deutschland</dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <WhyGerman
        title={t('why.german.title')}
        body={t('why.german.body')}
        bullets={[
          'Facharzt-Ausbildung 6+ Jahre · BÄK-zertifiziert',
          'Patient*innen-Daten in der EU (Frankfurt) · DSGVO + PDPL 2023',
          'Über 20 Jahre Klinik-Erfahrung im St. Anna Hospital',
        ]}
      />

      <section className="border-y border-ink-strong/5 bg-surface-warm">
        <div className="container-reading py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-strong">
            {t('home.how.title', { defaultValue: 'So einfach' })}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {(
              [
                {
                  step: '1',
                  title: t('home.how.step1.title', { defaultValue: 'Anmelden' }),
                  body: t('home.how.step1.body', {
                    defaultValue: 'In wenigen Minuten teilen Sie Ihre Symptome.',
                  }),
                },
                {
                  step: '2',
                  title: t('home.how.step2.title', { defaultValue: 'Vorbereitung' }),
                  body: t('home.how.step2.body', {
                    defaultValue: 'KI-Vor-Triage strukturiert Ihr Anliegen.',
                  }),
                },
                {
                  step: '3',
                  title: t('home.how.step3.title', { defaultValue: 'Konsultation' }),
                  body: t('home.how.step3.body', {
                    defaultValue: 'Der Arzt meldet sich persönlich.',
                  }),
                },
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

      <Testimonials
        title={t('testimonials.title')}
        items={[
          { body: t('testimonials.t1.body'), author: t('testimonials.t1.author') },
          { body: t('testimonials.t2.body'), author: t('testimonials.t2.author') },
          { body: t('testimonials.t3.body'), author: t('testimonials.t3.author') },
        ]}
      />

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
            {t('home.cta.title', { defaultValue: 'Bereit, das Gespräch zu beginnen?' })}
          </h2>
          <p className="mt-3 max-w-prose text-surface-warm/85">
            {t('home.cta.body', {
              defaultValue:
                'Vertraulich, in Ihrer Sprache, ohne Diagnose-Anspruch — nur klare nächste Schritte.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" onClick={onStartIntake}>
              {t('hero.cta.start')}
            </Button>
            <a
              href="https://wa.me/4923231234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center rounded-2xl border-2 border-surface-warm/40 px-6 text-base font-medium text-surface-warm hover:bg-surface-warm/10"
            >
              {t('home.schedule.cta')}
            </a>
          </div>
          <p className="mt-6 text-xs text-surface-warm/70">{t('emergency.jordan')}</p>
        </div>
      </section>
    </div>
  );
}
