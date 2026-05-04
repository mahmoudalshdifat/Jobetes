import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary',
  secondary:
    'bg-brand-secondary text-white hover:bg-brand-secondary/90 focus-visible:ring-brand-secondary',
  ghost:
    'bg-transparent text-ink-strong hover:bg-surface-warm focus-visible:ring-brand-primary',
  danger:
    'bg-accent-copper text-white hover:bg-accent-copper/90 focus-visible:ring-accent-copper',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-12 px-5 text-base gap-2',
  lg: 'h-14 px-7 text-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-medium tracking-tight',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'min-h-[3rem]',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...rest}
    >
      {leadingIcon ? <span aria-hidden>{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span aria-hidden>{trailingIcon}</span> : null}
    </button>
  );
});
