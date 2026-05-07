import { useEffect, useState } from 'react';
import { Button } from './Button.js';
import { cn } from './cn.js';

const STORAGE_KEY = 'jobetes-cookie-consent';

type Consent = 'all' | 'essential' | null;

export function getCookieConsent(): Consent {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY) as Consent;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: Consent): void {
  if (typeof window === 'undefined') return;
  try {
    if (consent) localStorage.setItem(STORAGE_KEY, consent);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function CookieBanner({
  text,
  acceptLabel,
  essentialLabel,
  className,
}: {
  text: string;
  acceptLabel: string;
  essentialLabel: string;
  className?: string;
}): JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = (consent: Consent) => {
    setCookieConsent(consent);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-ink-strong/10 bg-surface-white/95 p-4 shadow-lg backdrop-blur dark:border-surface-white/10 dark:bg-ink-strong/95',
        className,
      )}
    >
      <div className="container-reading flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">{text}</p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleAccept('essential')}>
            {essentialLabel}
          </Button>
          <Button size="sm" onClick={() => handleAccept('all')}>
            {acceptLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
