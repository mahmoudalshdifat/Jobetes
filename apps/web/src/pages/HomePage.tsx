import { useTranslation } from 'react-i18next';
import { Button, Card, TrustBar } from '@jobetes/ui';

/**
 * Hero + trust-signals + how-it-works + closing CTA. The "doctor card" on
 * the right is concrete proof — verifiable credentials and the hospital
 * link, not stock photography.
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
              <a
                href="https://www.annahospital.de/klinik-fuer-gastroenterologie/team.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center rounded-2xl px-7 text-lg font-medium text-ink-strong underline-offset-4 hover:underline"
              >
                {t('hero.cta.learn')} ↗
              </a>
            </div>

            <TrustBar
              className="mt-12 justify-start"
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

      <section className="border-y border-ink-strong/5 bg-surface-white">
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
                    defaultValue:
                      'In wenigen Minuten teilen Sie Ihre Symptome — auf Arabisch, Deutsch oder Englisch.',
                  }),
                },
                {
                  step: '2',
                  title: t('home.how.step2.title', { defaultValue: 'Vorbereitung' }),
                  body: t('home.how.step2.body', {
                    defaultValue:
                      'Eine sichere KI-Vor-Triage strukturiert Ihr Anliegen für das Gespräch.',
                  }),
                },
                {
                  step: '3',
                  title: t('home.how.step3.title', { defaultValue: 'Konsultation' }),
                  body: t('home.how.step3.body', {
                    defaultValue:
                      'Der Arzt meldet sich persönlich — per Video, Telefon oder Chat in Ihrer Sprache.',
                  }),
                },
              ] as const
            ).map((s) => (
              <li key={s.step} className="rounded-3xl bg-surface-warm p-6">
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

      <section className="container-reading py-16">
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
          <div className="mt-6">
            <Button size="lg" variant="secondary" onClick={onStartIntake}>
              {t('hero.cta.start')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
