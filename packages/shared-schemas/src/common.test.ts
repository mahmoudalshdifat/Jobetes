import { describe, expect, it } from 'vitest';
import {
  EmailSchema,
  GenderSchema,
  IsoDateSchema,
  LocaleSchema,
  NonEmptyStringSchema,
  PhoneSchema,
} from './common.js';

describe('common schemas', () => {
  it('LocaleSchema accepts ar/de/en, rejects others', () => {
    for (const loc of ['ar', 'de', 'en'] as const) {
      expect(() => LocaleSchema.parse(loc)).not.toThrow();
    }
    expect(() => LocaleSchema.parse('fr')).toThrow();
  });

  it('GenderSchema accepts all 4 categories', () => {
    for (const g of ['female', 'male', 'other', 'prefer_not_to_say'] as const) {
      expect(() => GenderSchema.parse(g)).not.toThrow();
    }
    expect(() => GenderSchema.parse('unknown')).toThrow();
  });

  it('PhoneSchema enforces E.164', () => {
    expect(() => PhoneSchema.parse('+962799123456')).not.toThrow();
    expect(() => PhoneSchema.parse('+491701234567')).not.toThrow();
    expect(() => PhoneSchema.parse('0799123456')).toThrow();
    expect(() => PhoneSchema.parse('+12')).toThrow();
    expect(() => PhoneSchema.parse('+12345678901234567890')).toThrow();
  });

  it('EmailSchema validates', () => {
    expect(() => EmailSchema.parse('hi@example.com')).not.toThrow();
    expect(() => EmailSchema.parse('not-an-email')).toThrow();
  });

  it('IsoDateSchema validates YYYY-MM-DD', () => {
    expect(() => IsoDateSchema.parse('2026-01-31')).not.toThrow();
    expect(() => IsoDateSchema.parse('31-01-2026')).toThrow();
    expect(() => IsoDateSchema.parse('2026/01/31')).toThrow();
  });

  it('NonEmptyStringSchema rejects whitespace-only', () => {
    expect(() => NonEmptyStringSchema.parse('  ')).toThrow();
    expect(() => NonEmptyStringSchema.parse('hi')).not.toThrow();
  });
});
