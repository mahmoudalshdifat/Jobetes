import { describe, expect, it } from 'vitest';
import { ConsentSchema } from './consent.js';

const valid = {
  privacyPolicyVersion: '2026-05-04',
  acceptedAt: new Date().toISOString(),
  presentedLocale: 'ar' as const,
  termsOfService: true,
  privacyPolicy: true,
  processingHealthData: true,
  crossBorderTransfer: true,
};

describe('ConsentSchema', () => {
  it('accepts a valid consent', () => {
    expect(() => ConsentSchema.parse(valid)).not.toThrow();
  });

  it('defaults marketingOptIn and familyAccessOptIn to false', () => {
    const parsed = ConsentSchema.parse(valid);
    expect(parsed.marketingOptIn).toBe(false);
    expect(parsed.familyAccessOptIn).toBe(false);
  });

  it('rejects when ToS not accepted', () => {
    expect(() =>
      ConsentSchema.parse({ ...valid, termsOfService: false }),
    ).toThrow();
  });

  it('rejects when privacy policy not accepted', () => {
    expect(() => ConsentSchema.parse({ ...valid, privacyPolicy: false })).toThrow();
  });

  it('rejects when processingHealthData not accepted (Art. 9 GDPR)', () => {
    expect(() => ConsentSchema.parse({ ...valid, processingHealthData: false })).toThrow();
  });

  it('rejects when cross-border transfer not acknowledged', () => {
    expect(() => ConsentSchema.parse({ ...valid, crossBorderTransfer: false })).toThrow();
  });

  it('accepts opt-in flags being explicitly true', () => {
    const parsed = ConsentSchema.parse({ ...valid, marketingOptIn: true, familyAccessOptIn: true });
    expect(parsed.marketingOptIn).toBe(true);
    expect(parsed.familyAccessOptIn).toBe(true);
  });
});
