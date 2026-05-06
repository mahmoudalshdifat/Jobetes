import { useEffect, useState } from 'react';
import { cn } from './cn.js';

export type Theme = 'light' | 'dark' | 'system';

export type ThemeToggleProps = {
  current: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
};

export function ThemeToggle({ current, onChange, className }: ThemeToggleProps): JSX.Element {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={cn('inline-block h-9 w-24', className)} />;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-ink-strong/10 bg-surface-white p-1 text-sm shadow-sm dark:border-ink-strong/20 dark:bg-ink-strong',
        className,
      )}
    >
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            'min-h-9 rounded-full px-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
            current === t
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-soft hover:bg-ink-strong/5 dark:text-ink-soft/80 dark:hover:bg-ink-strong/10',
          )}
          aria-pressed={current === t}
        >
          {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
        </button>
      ))}
    </div>
  );
}
