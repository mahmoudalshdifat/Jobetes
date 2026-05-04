import { cn } from './cn.js';

export type LangToggleProps = {
  current: 'ar' | 'de' | 'en';
  onChange: (locale: 'ar' | 'de' | 'en') => void;
  label: string;
  className?: string;
};

const LANGS = [
  { code: 'ar' as const, label: 'العربية' },
  { code: 'en' as const, label: 'English' },
  { code: 'de' as const, label: 'Deutsch' },
];

export function LangToggle({ current, onChange, label, className }: LangToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-ink-strong/10 bg-surface-white p-1 text-sm',
        className,
      )}
    >
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          role="radio"
          aria-checked={current === lang.code}
          onClick={() => onChange(lang.code)}
          className={cn(
            'min-h-9 rounded-full px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
            current === lang.code ? 'bg-brand-primary text-white' : 'text-ink-soft',
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
