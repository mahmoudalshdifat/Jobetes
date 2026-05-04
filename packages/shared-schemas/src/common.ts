import { z } from 'zod';

export const LocaleSchema = z.enum(['ar', 'de', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

export const GenderSchema = z.enum(['female', 'male', 'other', 'prefer_not_to_say']);
export type Gender = z.infer<typeof GenderSchema>;

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{6,16}$/u, 'phone must be in international E.164 format, e.g. +962…');

export const EmailSchema = z.string().trim().email();

export const NonEmptyStringSchema = z.string().trim().min(1);

export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, 'must be ISO date YYYY-MM-DD');
