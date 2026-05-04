import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangToggle } from './LangToggle.js';

describe('LangToggle', () => {
  it('renders all three locales', () => {
    render(<LangToggle current="ar" onChange={() => {}} label="lang" />);
    expect(screen.getByRole('radio', { name: 'العربية' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Deutsch' })).toBeInTheDocument();
  });

  it('marks current locale aria-checked', () => {
    render(<LangToggle current="de" onChange={() => {}} label="lang" />);
    expect(screen.getByRole('radio', { name: 'Deutsch' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the locale code', () => {
    const onChange = vi.fn();
    render(<LangToggle current="ar" onChange={onChange} label="lang" />);
    screen.getByRole('radio', { name: 'English' }).click();
    expect(onChange).toHaveBeenCalledWith('en');
  });
});
