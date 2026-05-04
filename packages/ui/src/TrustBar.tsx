import { cn } from './cn.js';

export type TrustBarItem = { label: string; icon?: string };
export type TrustBarProps = { items: TrustBarItem[]; className?: string };

export function TrustBar({ items, className }: TrustBarProps) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-soft',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          {item.icon ? (
            <span aria-hidden className="text-brand-secondary">
              {item.icon}
            </span>
          ) : (
            <span aria-hidden className="size-1.5 rounded-full bg-brand-secondary" />
          )}
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
