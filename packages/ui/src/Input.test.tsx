import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input.js';

describe('Input', () => {
  it('renders with default styles + 48px height (Fitts)', () => {
    render(<Input placeholder="hello" />);
    const el = screen.getByPlaceholderText('hello');
    expect(el.className).toMatch(/h-12/);
    expect(el.className).toMatch(/rounded-2xl/);
  });

  it('forwards ref', () => {
    let captured: HTMLInputElement | null = null;
    render(<Input ref={(el) => (captured = el)} data-testid="ref-input" />);
    expect(captured).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className alongside defaults', () => {
    render(<Input className="extra-cls" placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).toMatch(/extra-cls/);
  });

  it('forwards type and value props', () => {
    render(<Input type="email" defaultValue="x@y.com" placeholder="email" />);
    const el = screen.getByPlaceholderText('email') as HTMLInputElement;
    expect(el.type).toBe('email');
    expect(el.value).toBe('x@y.com');
  });
});
