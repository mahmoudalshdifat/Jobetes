import type { DoctorProfile } from '@jobetes/shared-schemas';
import { Card } from './Card.js';

export type DoctorBadgeProps = {
  profile: DoctorProfile;
  locale: 'ar' | 'de' | 'en';
  labels: { credentials: string; specialties: string; languages: string; viewSource: string };
};

export function DoctorBadge({ profile, locale, labels }: DoctorBadgeProps) {
  return (
    <Card title={profile.fullName} description={profile.title}>
      {profile.photoUrl ? (
        <img
          src={profile.photoUrl}
          alt={profile.fullName}
          loading="lazy"
          className="mb-4 size-24 rounded-full object-cover"
        />
      ) : null}
      <p className="mb-4 text-ink-soft">{profile.bio[locale] ?? profile.bio.en}</p>
      <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {labels.credentials}
          </dt>
          <dd>
            <ul className="mt-1 list-disc ps-4 text-sm">
              {profile.credentials.map((c) => (
                <li key={c.label}>{c.label}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {labels.specialties}
          </dt>
          <dd>
            <ul className="mt-1 list-disc ps-4 text-sm">
              {profile.specialties.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {labels.languages}
          </dt>
          <dd className="mt-1 text-sm">{profile.languages.join(' · ')}</dd>
        </div>
      </dl>
      <a
        className="mt-6 inline-block text-sm text-brand-primary underline underline-offset-2"
        href={profile.hospitalUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {labels.viewSource} ↗
      </a>
    </Card>
  );
}
