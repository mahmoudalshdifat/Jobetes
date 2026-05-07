import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from './cn.js';
import { Button } from './Button.js';

export type DatePickerProps = {
  value?: string; // ISO date string YYYY-MM-DD
  onChange: (value: string | undefined) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, months: number): Date {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + months);
  return nd;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  disabled = false,
  className,
}: DatePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? new Date(value + 'T00:00:00') : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();

  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;

  const minDate = min ? new Date(min + 'T00:00:00') : undefined;
  const maxDate = max ? new Date(max + 'T00:00:00') : undefined;

  const isDisabled = useCallback(
    (d: Date): boolean => {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    },
    [minDate, maxDate],
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const startDay = monthStart.getDay(); // 0 = Sunday
  const daysInMonth = monthEnd.getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-2xl border border-ink-strong/15 bg-surface-white px-4 text-left',
          'text-ink-strong placeholder:text-ink-soft/50',
          'transition-colors hover:border-ink-strong/25',
          'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'dark:border-surface-white/15 dark:bg-ink-strong dark:text-surface-white',
        )}
      >
        <span className={value ? 'text-ink-strong' : 'text-ink-soft/50'}>
          {value ? new Date(value + 'T00:00:00').toLocaleDateString() : placeholder}
        </span>
        <CalendarIcon />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Calendar"
          className={cn(
            'absolute z-50 mt-2 w-72 rounded-3xl border border-ink-strong/10 bg-surface-white p-4 shadow-xl',
            'dark:border-surface-white/10 dark:bg-ink-strong',
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              ‹
            </Button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              ›
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-xs font-medium text-ink-soft">
                {wd}
              </div>
            ))}
            {weeks.flat().map((date, idx) =>
              date ? (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled(date)}
                  onClick={() => {
                    onChange(formatISO(date));
                    setOpen(false);
                  }}
                  aria-pressed={selectedDate ? isSameDay(date, selectedDate) : false}
                  className={cn(
                    'h-8 w-8 rounded-full text-sm transition-colors',
                    selectedDate && isSameDay(date, selectedDate)
                      ? 'bg-brand-primary text-white'
                      : 'hover:bg-surface-warm dark:hover:bg-surface-white/10',
                    isDisabled(date) && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div key={idx} />
              ),
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => { onChange(undefined); setOpen(false); }}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
