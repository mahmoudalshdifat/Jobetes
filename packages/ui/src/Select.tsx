import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './cn.js';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-12 w-full rounded-2xl border border-ink-strong/15 bg-surface-white px-4',
        'text-ink-strong',
        'transition-colors appearance-none',
        'hover:border-ink-strong/25',
        'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'dark:border-surface-white/15 dark:bg-ink-strong dark:text-surface-white',
        className,
      )}
      {...rest}
    />
  );
});
