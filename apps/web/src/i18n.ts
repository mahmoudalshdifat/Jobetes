import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, detectInitialLocale, isRtl, resources } from '@jobetes/i18n';
import type { Locale } from '@jobetes/shared-schemas';

/**
 * Pre-compute the default the LanguageDetector will use when no localStorage
 * entry is set. We bias towards Arabic for Jordan/Levant/MENA timezones —
 * Jordanian phones often ship with English UI but speakers prefer Arabic
 * content.
 */
function preferredInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }
  return detectInitialLocale({
    timezone,
    navigatorLanguage: window.navigator?.language,
  });
}

await i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: preferredInitialLocale(),
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

function applyDirection(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
}

applyDirection((i18next.resolvedLanguage ?? DEFAULT_LOCALE) as Locale);
i18next.on('languageChanged', (lng) => applyDirection(lng as Locale));

export const i18n = i18next;
