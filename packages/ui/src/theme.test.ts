import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getTheme, listenSystemTheme, setTheme } from './theme.js';

describe('theme utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getTheme defaults to system when nothing stored', () => {
    expect(getTheme()).toBe('system');
  });

  it('getTheme returns stored value when valid', () => {
    localStorage.setItem('jobetes-theme', 'dark');
    expect(getTheme()).toBe('dark');
  });

  it('getTheme falls back to system when stored value is invalid', () => {
    localStorage.setItem('jobetes-theme', 'rainbow');
    expect(getTheme()).toBe('system');
  });

  it('setTheme persists and applies', () => {
    setTheme('dark');
    expect(localStorage.getItem('jobetes-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applyTheme with system + dark media query → adds .dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);
    applyTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applyTheme with system + light media query → removes .dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);
    document.documentElement.classList.add('dark');
    applyTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('listenSystemTheme returns a no-op when matchMedia missing', () => {
    const original = window.matchMedia;
    // @ts-expect-error simulate missing API
    window.matchMedia = undefined;
    const off = listenSystemTheme(() => {});
    expect(off).toBeTypeOf('function');
    expect(() => off()).not.toThrow();
    window.matchMedia = original;
  });

  it('listenSystemTheme registers and removes change handlers', () => {
    const handlers: Array<(e: MediaQueryListEvent) => void> = [];
    const add = vi.fn((_e: string, h: (e: MediaQueryListEvent) => void) => handlers.push(h));
    const remove = vi.fn();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '',
      addEventListener: add,
      removeEventListener: remove,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);
    const cb = vi.fn();
    const off = listenSystemTheme(cb);
    expect(add).toHaveBeenCalled();
    handlers[0]?.({ matches: true } as MediaQueryListEvent);
    expect(cb).toHaveBeenCalledWith(true);
    off();
    expect(remove).toHaveBeenCalled();
  });
});
