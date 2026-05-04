import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, detectLocale, isRtl, resources } from './index.js';

describe('i18n', () => {
  it('marks Arabic as RTL and DE/EN as LTR', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('de')).toBe(false);
    expect(isRtl('en')).toBe(false);
  });

  it('detects locale from navigator.language-style strings', () => {
    expect(detectLocale('ar-JO')).toBe('ar');
    expect(detectLocale('de-DE')).toBe('de');
    expect(detectLocale('en-US')).toBe('en');
    expect(detectLocale('fr-FR')).toBe(DEFAULT_LOCALE);
    expect(detectLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it('has translations for every supported locale and parity of keys', () => {
    const enKeys = Object.keys(resources.en.common).sort();
    for (const loc of SUPPORTED_LOCALES) {
      const keys = Object.keys(resources[loc].common).sort();
      expect(keys, `locale ${loc} missing keys`).toEqual(enKeys);
    }
  });
});
