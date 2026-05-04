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

export const resources = {
  ar: { common: ar },
  de: { common: de },
  en: { common: en },
} as const;

export type TranslationKey = keyof typeof en;
