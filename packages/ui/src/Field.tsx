import { useId, type ReactNode } from 'react';
import { cn } from './cn.js';

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (controlProps: { id: string; 'aria-describedby'?: string }) => ReactNode;
};

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-strong">
        {label}
        {required ? (
          <span aria-hidden className="text-accent-copper ms-1">
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-describedby': describedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-accent-copper">
          {error}
        </p>
      ) : null}
    </div>
  );
}
