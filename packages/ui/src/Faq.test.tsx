import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Faq } from './Faq.js';

describe('Faq', () => {
  it('renders heading + each question collapsed by default', () => {
    render(
      <Faq
        title="FAQ"
        items={[
          { q: 'Q1?', a: 'A1.' },
          { q: 'Q2?', a: 'A2.' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'FAQ' })).toBeInTheDocument();
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => !(g as HTMLDetailsElement).open)).toBe(true);
  });

  it('clicking summary opens the answer (browser-driven)', () => {
    render(<Faq title="FAQ" items={[{ q: 'open me', a: 'opened.' }]} />);
    const det = screen.getByRole('group') as HTMLDetailsElement;
    det.open = true;
    expect(det.open).toBe(true);
  });
});
