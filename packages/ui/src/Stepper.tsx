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
                'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                isDone && 'border-brand-secondary bg-brand-secondary text-white',
                isActive && 'border-brand-primary bg-brand-primary text-white',
                !isDone && !isActive && 'border-ink-strong/20 text-ink-soft',
              )}
            >
              {idx + 1}
            </span>
            <span className={cn(isActive ? 'text-ink-strong' : 'text-ink-soft')}>{step}</span>
            {idx < steps.length - 1 ? <span aria-hidden className="text-ink-soft">·</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
