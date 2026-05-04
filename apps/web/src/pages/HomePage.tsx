import { useTranslation } from 'react-i18next';
import { Button, TrustBar } from '@jobetes/ui';

export function HomePage({ onStartIntake }: { onStartIntake: () => void }): JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="container-reading py-12 sm:py-16">
      <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink-strong sm:text-4xl">
        {t('hero.title')}
      </h1>
      <p className="mt-4 text-lg text-ink-soft">{t('hero.subtitle')}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onStartIntake}>
          {t('hero.cta.start')}
        </Button>
        <Button size="lg" variant="ghost">
          {t('hero.cta.learn')}
        </Button>
      </div>
      <TrustBar
        className="mt-10 justify-start"
        items={[
          { label: t('trust.privacyByDesign') },
          { label: t('trust.realDoctor') },
          { label: t('trust.noDiagnosisDisclaimer') },
        ]}
      />
    </section>
  );
}
