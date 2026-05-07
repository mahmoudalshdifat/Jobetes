import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle.js';

describe('ThemeToggle', () => {
  it('renders 3 buttons (light/dark/system) after mount', async () => {
    render(<ThemeToggle current="light" onChange={() => {}} />);
    await act(async () => {});
    expect(screen.getAllByRole('button').length).toBe(3);
  });

  it('marks the current theme via aria-pressed', async () => {
    render(<ThemeToggle current="dark" onChange={() => {}} />);
    await act(async () => {});
    const buttons = screen.getAllByRole('button');
    expect(buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.textContent).toMatch(
      /🌙/,
    );
  });

  it('fires onChange with the picked theme', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle current="light" onChange={onChange} />);
    await act(async () => {});
    const dark = screen.getAllByRole('button').find((b) => b.textContent?.includes('🌙'));
    dark?.click();
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
