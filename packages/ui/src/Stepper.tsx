import { cn } from './cn.js';

export type StepperProps = {
  steps: string[];
  currentIndex: number;
  className?: string;
};

export function Stepper({ steps, currentIndex, className }: StepperProps) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-2 text-sm', className)}
      aria-label="Form progress"
    >
      {steps.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isDone = idx < currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'flex size-8 items-center justify-center rounded-full border text-xs font-semibold shadow-sm transition-colors',
                isDone && 'border-brand-secondary bg-brand-secondary text-white',
                isActive && 'border-brand-primary bg-brand-primary text-white ring-2 ring-brand-primary/20',
                !isDone && !isActive && 'border-ink-strong/15 bg-surface-white text-ink-soft dark:border-surface-white/15 dark:bg-ink-strong dark:text-ink-soft',
              )}
            >
              {idx + 1}
            </span>
            <span
              className={cn(
                'hidden font-medium sm:inline',
                isActive ? 'text-ink-strong dark:text-surface-white' : 'text-ink-soft',
              )}
            >
              {step}
            </span>
            {idx < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'mx-1 hidden h-px w-4 sm:inline-block',
                  isDone ? 'bg-brand-secondary' : 'bg-ink-strong/15',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
