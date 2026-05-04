import { cn } from './cn.js';

export type JordanCalloutProps = {
  title: string;
  body: string;
  cta?: { label: string; onClick?: () => void };
  className?: string;
};

/**
 * Top-of-page strip explicitly addressing Jordanian patients. Designed to
 * appear above the fold for non-Arabic visitors so they see an obvious
 * "Continue in Arabic" affordance.
 */
export function JordanCallout({ title, body, cta, className }: JordanCalloutProps): JSX.Element {
  return (
    <aside
      className={cn(
        'border-b border-brand-secondary/30 bg-gradient-to-r from-brand-secondary/10 via-brand-secondary/5 to-transparent',
        className,
      )}
      role="region"
      aria-label={title}
    >
      <div className="container-reading flex flex-col items-start gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <span aria-hidden className="text-2xl">
            🇯🇴
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-strong">{title}</p>
            <p className="text-xs text-ink-soft">{body}</p>
          </div>
        </div>
        {cta ? (
          <button
            type="button"
            onClick={cta.onClick}
            className="rounded-full border border-brand-primary px-4 py-1.5 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
          >
            {cta.label} →
          </button>
        ) : null}
      </div>
    </aside>
  );
}
