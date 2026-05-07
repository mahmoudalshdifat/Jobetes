import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhyGerman } from './WhyGerman.js';

describe('WhyGerman', () => {
  it('renders title + body', () => {
    render(<WhyGerman title="Why German?" body="Rigorous training." />);
    expect(screen.getByRole('heading', { name: 'Why German?' })).toBeInTheDocument();
    expect(screen.getByText('Rigorous training.')).toBeInTheDocument();
  });

  it('renders 3 bullets when provided, no <ul> when omitted', () => {
    const { rerender, container } = render(
      <WhyGerman title="t" body="b" />,
    );
    expect(container.querySelector('ul')).toBeNull();
    rerender(
      <WhyGerman
        title="t"
        body="b"
        bullets={['certified', 'EU-resident data', '20+ years']}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('certified')).toBeInTheDocument();
  });
});
