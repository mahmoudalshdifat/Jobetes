import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'section' | 'article';
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
};

export function Card({
  as: Tag = 'section',
  title,
  description,
  footer,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-3xl border border-ink-strong/10 bg-surface-white p-6 shadow-sm',
        'sm:p-8',
        className,
      )}
      {...rest}
    >
      {title ? (
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-ink-strong">{title}</h2>
      ) : null}
      {description ? <p className="mb-4 text-ink-soft">{description}</p> : null}
      <div>{children}</div>
      {footer ? <div className="mt-6 border-t border-ink-strong/10 pt-4">{footer}</div> : null}
    </Tag>
  );
}
