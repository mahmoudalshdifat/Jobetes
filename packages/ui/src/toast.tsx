import React, { createContext, useCallback, useContext, useState } from 'react';
import { cn } from './cn.js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export type ToastContextValue = {
  show: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export type ToastProviderProps = { children: React.ReactNode };

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-accent-olive text-white',
  error: 'bg-accent-copper text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-brand-primary text-white',
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }): JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg transition-all toast-enter',
        TYPE_STYLES[item.type],
      )}
      role="status"
    >
      <span className="text-sm font-medium">{item.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="ms-auto inline-flex size-6 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
