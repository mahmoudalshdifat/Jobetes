import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton.js';

describe('Skeleton', () => {
  it('default text variant renders one shimmer line', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(1);
  });

  it('text variant respects lines prop', () => {
    const { container } = render(<Skeleton lines={5} />);
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(5);
  });

  it('card variant renders header + body + footer-lines (lines+2)', () => {
    const { container } = render(<Skeleton variant="card" lines={3} />);
    // 1 (heading) + 1 (subhead) + 3 (body) = 5 shimmer divs
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(5);
  });

  it('table-row variant renders 4 cells', () => {
    const { container } = render(<Skeleton variant="table-row" />);
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(4);
  });

  it('circle variant is round', () => {
    const { container } = render(<Skeleton variant="circle" />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('forwards className', () => {
    const { container } = render(<Skeleton className="my-skel" />);
    expect(container.firstChild).toHaveClass('my-skel');
  });
});
