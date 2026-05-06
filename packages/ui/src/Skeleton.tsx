import { cn } from './cn.js';

export type SkeletonProps = {
  variant?: 'text' | 'card' | 'circle' | 'table-row';
  lines?: number;
  className?: string;
};

export function Skeleton({ variant = 'text', lines = 1, className }: SkeletonProps): JSX.Element {
  if (variant === 'table-row') {
    return (
      <div className={cn('flex gap-3', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded-lg bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10" />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-3xl border border-ink-strong/10 bg-surface-white p-6 dark:border-surface-white/10 dark:bg-ink-strong',
          className,
        )}
      >
        <div className="h-5 w-1/3 rounded-lg bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10" />
        <div className="mt-2 h-4 w-2/3 rounded-lg bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-full rounded-lg bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10"
              style={{ width: `${85 + Math.random() * 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn(
          'size-24 rounded-full bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10',
          className,
        )}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-ink-strong/10 skeleton-shimmer dark:bg-surface-white/10"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}
