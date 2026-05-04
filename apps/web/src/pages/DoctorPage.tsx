import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DoctorBadge } from '@jobetes/ui';
import type { DoctorProfile, Locale } from '@jobetes/shared-schemas';

export function DoctorPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/doctor/profile')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as DoctorProfile;
      })
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container-reading py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('doctor.title')}</h1>
      {profile ? (
        <DoctorBadge
          profile={profile}
          locale={i18n.resolvedLanguage as Locale}
          labels={{
            credentials: t('doctor.credentials'),
            specialties: t('doctor.specialties'),
            languages: t('doctor.languages'),
            viewSource: t('doctor.viewSource'),
          }}
        />
      ) : error ? (
        <p role="alert" className="text-accent-copper">
          {error}
        </p>
      ) : (
        <p className="text-ink-soft">…</p>
      )}
    </section>
  );
}
