import type { Locale } from '@jobetes/shared-schemas';
import ar from '../locales/ar/common.json' with { type: 'json' };
import de from '../locales/de/common.json' with { type: 'json' };
import en from '../locales/en/common.json' with { type: 'json' };

export const SUPPORTED_LOCALES = ['ar', 'de', 'en'] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = 'ar';
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export function detectLocale(input: string | undefined | null): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();
  for (const candidate of SUPPORTED_LOCALES) {
    if (lower.startsWith(candidate)) return candidate;
  }
  return DEFAULT_LOCALE;
}

/**
 * Heuristic that errs on the side of Arabic for Levant/Gulf/MENA visitors
 * even when their browser language is English (very common in Jordan —
 * many phones ship with English UI but speakers prefer Arabic content).
 * Uses the IANA timezone, locally cached by the OS — no GeoIP, no PII.
 */
const ARABIC_TIMEZONES = new Set([
  'Asia/Amman', 'Asia/Damascus', 'Asia/Beirut', 'Asia/Hebron', 'Asia/Jerusalem',
  'Asia/Gaza', 'Asia/Baghdad', 'Asia/Riyadh', 'Asia/Kuwait', 'Asia/Qatar',
  'Asia/Bahrain', 'Asia/Dubai', 'Asia/Muscat',
  'Africa/Cairo', 'Africa/Tunis', 'Africa/Algiers', 'Africa/Casablanca',
]);

export function detectInitialLocale(opts: {
  timezone?: string;
  navigatorLanguage?: string;
}): Locale {
  if (opts.timezone && ARABIC_TIMEZONES.has(opts.timezone)) return 'ar';
  return detectLocale(opts.navigatorLanguage);
}

export const resources = {
  ar: { common: ar },
  de: { common: de },
  en: { common: en },
} as const;

export type TranslationKey = keyof typeof en;

// `lint.ts` uses node:fs APIs and is a CI/test-only utility. Import it
// directly from `./lint` in test files — we do NOT re-export it here
// because the browser bundle would otherwise try to ship Node built-ins.
