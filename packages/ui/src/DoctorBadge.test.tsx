import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorBadge } from './DoctorBadge.js';

const profile = {
  fullName: 'Dr. med. Mahmoud Al-Shdaifat',
  title: 'Oberarzt',
  hospital: 'St. Anna Hospital Herne',
  hospitalUrl: 'https://www.annahospital.de/team.html',
  city: 'Herne',
  countryCode: 'DE',
  languages: ['de', 'en', 'ar'] as ('ar' | 'de' | 'en')[],
  credentials: [{ label: 'Facharzt' }, { label: 'Diabetologe' }],
  specialties: ['Endoscopy', 'IBD'],
  bio: { de: 'de-bio', en: 'en-bio', ar: 'ar-bio' },
};

const labels = {
  credentials: 'Credentials',
  specialties: 'Specialties',
  languages: 'Languages',
  viewSource: 'View source',
};

describe('DoctorBadge', () => {
  it('renders the doctor name + title + hospital link', () => {
    render(<DoctorBadge profile={profile} locale="en" labels={labels} />);
    expect(screen.getByRole('heading', { name: profile.fullName })).toBeInTheDocument();
    expect(screen.getByText('Oberarzt')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', profile.hospitalUrl);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows the locale-specific bio', () => {
    render(<DoctorBadge profile={profile} locale="ar" labels={labels} />);
    expect(screen.getByText('ar-bio')).toBeInTheDocument();
  });

  it('falls back to en when locale-specific bio missing', () => {
    const noAr = { ...profile, bio: { de: 'de', en: 'en-only' } as Record<string, string> };
    render(<DoctorBadge profile={noAr as never} locale="ar" labels={labels} />);
    expect(screen.getByText('en-only')).toBeInTheDocument();
  });

  it('lists credentials and specialties as <li>', () => {
    render(<DoctorBadge profile={profile} locale="en" labels={labels} />);
    expect(screen.getByText('Facharzt')).toBeInTheDocument();
    expect(screen.getByText('Endoscopy')).toBeInTheDocument();
    expect(screen.getByText('IBD')).toBeInTheDocument();
  });

  it('renders the photo when photoUrl is present', () => {
    const withPhoto = { ...profile, photoUrl: 'https://example.com/p.jpg' };
    render(<DoctorBadge profile={withPhoto as never} locale="en" labels={labels} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/p.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});
