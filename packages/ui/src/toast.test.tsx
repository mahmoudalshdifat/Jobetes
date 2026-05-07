import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './toast.js';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function ShowOnMount({
  message,
  type,
  duration,
}: {
  message: string;
  type?: Parameters<ReturnType<typeof useToast>['show']>[1];
  duration?: number;
}): JSX.Element {
  const { show } = useToast();
  // call show directly during render — fine because useToast is stable
  if (typeof window !== 'undefined' && !(window as { __shown?: boolean }).__shown) {
    (window as { __shown?: boolean }).__shown = true;
    show(message, type, duration);
  }
  return <span />;
}

describe('Toast', () => {
  beforeEach(() => {
    delete (window as { __shown?: boolean }).__shown;
  });

  it('useToast throws outside provider', () => {
    function Probe(): JSX.Element {
      useToast();
      return <span />;
    }
    expect(() => render(<Probe />)).toThrow(/ToastProvider/u);
  });

  it('renders shown toasts and dismisses after duration', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="saved" type="success" duration={3000} />
      </ToastProvider>,
    );
    expect(screen.getByText('saved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText('saved')).toBeNull();
  });

  it('does not auto-dismiss when duration=0', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="sticky" type="warning" duration={0} />
      </ToastProvider>,
    );
    expect(screen.getByText('sticky')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('sticky')).toBeInTheDocument();
  });

  it('manual dismiss button removes the toast', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="bye" type="error" duration={0} />
      </ToastProvider>,
    );
    const close = screen.getByLabelText('Dismiss');
    act(() => close.click());
    expect(screen.queryByText('bye')).toBeNull();
  });
});
