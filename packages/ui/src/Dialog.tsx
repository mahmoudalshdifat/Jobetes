import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cn } from './cn.js';
import { Button } from './Button.js';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Disable closing via backdrop click or Escape key */
  persistent?: boolean;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
  persistent = false,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) {
        onClose();
      }
    },
    [onClose, persistent],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && !persistent) {
          onClose();
        }
      }}
      aria-hidden="false"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-strong/40 backdrop-blur-sm dark:bg-ink-strong/60" />

      {/* Dialog panel */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        className={cn(
          'relative w-full max-w-lg rounded-3xl border border-ink-strong/10 bg-surface-white p-6 shadow-xl',
          'dark:border-surface-white/10 dark:bg-ink-strong',
          'sm:p-8',
          'animate-in fade-in zoom-in-95 duration-200',
          className,
        )}
      >
        {!persistent && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 rounded-full p-0"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </Button>
        )}

        {title ? (
          <h2 id="dialog-title" className="mb-2 pr-8 text-xl font-semibold tracking-tight text-ink-strong">
            {title}
          </h2>
        ) : null}

        {description ? (
          <p id="dialog-description" className="mb-4 text-ink-soft">
            {description}
          </p>
        ) : null}

        <div>{children}</div>

        {footer ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-strong/10 pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
