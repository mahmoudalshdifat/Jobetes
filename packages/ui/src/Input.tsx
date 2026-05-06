import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './cn.js';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-2xl border border-ink-strong/15 bg-surface-white px-4',
        'text-ink-strong placeholder:text-ink-soft/50',
        'transition-colors',
        'hover:border-ink-strong/25',
        'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'dark:border-surface-white/15 dark:bg-ink-strong dark:text-surface-white dark:placeholder:text-ink-soft/50',
        className,
      )}
      {...rest}
    />
  );
});
