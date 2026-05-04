import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card.js';

describe('Card', () => {
  it('renders title and description', () => {
    render(
      <Card title="Hello" description="world">
        <p>body</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <Card title="t" footer={<span>foot</span>}>
        x
      </Card>,
    );
    expect(screen.getByText('foot')).toBeInTheDocument();
  });

  it('renders without title or description', () => {
    render(<Card>plain</Card>);
    expect(screen.getByText('plain')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('respects `as` to change the wrapper element', () => {
    const { container } = render(<Card as="article">x</Card>);
    expect(container.querySelector('article')).not.toBeNull();
  });
});
