import { z } from 'zod';
import { LocaleSchema } from './common.js';

export const DoctorCredentialSchema = z.object({
  label: z.string(),
  body: z.string().optional(),
});

export const DoctorProfileSchema = z.object({
  fullName: z.string(),
  title: z.string(),
  hospital: z.string(),
  hospitalUrl: z.string().url(),
  city: z.string(),
  countryCode: z.string().length(2),
  photoUrl: z.string().url().optional(),
  languages: z.array(LocaleSchema),
  credentials: z.array(DoctorCredentialSchema),
  specialties: z.array(z.string()),
  bio: z.record(LocaleSchema, z.string()),
});
export type DoctorProfile = z.infer<typeof DoctorProfileSchema>;
