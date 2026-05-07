import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JordanCallout } from './JordanCallout.js';

describe('JordanCallout', () => {
  it('renders title + body + flag', () => {
    render(<JordanCallout title="مرحباً" body="استمر بالعربية" />);
    expect(screen.getByText('مرحباً')).toBeInTheDocument();
    expect(screen.getByText('استمر بالعربية')).toBeInTheDocument();
    // 🇯🇴 flag is in the DOM via aria-hidden span
    expect(screen.getByLabelText('مرحباً')).toBeInTheDocument();
  });

  it('renders CTA button + fires onClick', () => {
    const onClick = vi.fn();
    render(
      <JordanCallout
        title="Hi"
        body="Keep going"
        cta={{ label: 'Switch to Arabic', onClick }}
      />,
    );
    const btn = screen.getByRole('button', { name: /Switch to Arabic/u });
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('omits the CTA when not provided', () => {
    render(<JordanCallout title="Hi" body="x" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
