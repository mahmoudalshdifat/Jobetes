import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Testimonials } from './Testimonials.js';

describe('Testimonials', () => {
  it('renders title + each item with quote and author', () => {
    render(
      <Testimonials
        title="Voices"
        items={[
          { body: 'safe and kind', author: 'Layla' },
          { body: 'thorough', author: 'Omar' },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Voices' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('safe and kind')).toBeInTheDocument();
    expect(screen.getByText('Layla')).toBeInTheDocument();
  });

  it('shows optional disclaimer footer when provided', () => {
    render(
      <Testimonials
        title="Voices"
        items={[{ body: 'x', author: 'y' }]}
        disclaimer="Names changed for privacy."
      />,
    );
    expect(screen.getByText('Names changed for privacy.')).toBeInTheDocument();
  });
});
