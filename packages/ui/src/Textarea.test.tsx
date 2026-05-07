import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Textarea } from './Textarea.js';

describe('Textarea', () => {
  it('renders with vertical resize allowed', () => {
    render(<Textarea placeholder="notes" />);
    expect(screen.getByPlaceholderText('notes').className).toMatch(/resize-y/);
  });

  it('forwards rows, value, and ref', () => {
    let captured: HTMLTextAreaElement | null = null;
    render(
      <Textarea
        ref={(el) => (captured = el)}
        rows={4}
        defaultValue="hello"
        placeholder="x"
      />,
    );
    const el = screen.getByPlaceholderText('x') as HTMLTextAreaElement;
    expect(el.rows).toBe(4);
    expect(el.value).toBe('hello');
    expect(captured).toBe(el);
  });
});
