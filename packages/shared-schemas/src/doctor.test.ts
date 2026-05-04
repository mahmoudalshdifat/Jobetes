import { describe, expect, it } from 'vitest';
import { DoctorProfileSchema } from './doctor.js';

const valid = {
  fullName: 'Dr. Test',
  title: 'Oberarzt',
  hospital: 'Test Hospital',
  hospitalUrl: 'https://example.com',
  city: 'Herne',
  countryCode: 'DE',
  languages: ['de', 'en'],
  credentials: [{ label: 'Specialist' }, { label: 'X', body: 'Y' }],
  specialties: ['Endoscopy'],
  bio: { de: 'de', en: 'en', ar: 'ar' },
};

describe('DoctorProfileSchema', () => {
  it('accepts a valid profile', () => {
    expect(() => DoctorProfileSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid hospitalUrl', () => {
    expect(() => DoctorProfileSchema.parse({ ...valid, hospitalUrl: 'not-a-url' })).toThrow();
  });

  it('rejects countryCode that is not exactly 2 chars', () => {
    expect(() => DoctorProfileSchema.parse({ ...valid, countryCode: 'DEU' })).toThrow();
    expect(() => DoctorProfileSchema.parse({ ...valid, countryCode: 'D' })).toThrow();
  });

  it('rejects unsupported locale in languages', () => {
    expect(() =>
      DoctorProfileSchema.parse({ ...valid, languages: ['fr'] as unknown as string[] }),
    ).toThrow();
  });
});
