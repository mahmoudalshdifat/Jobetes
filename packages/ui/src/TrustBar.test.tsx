import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBar } from './TrustBar.js';

describe('TrustBar', () => {
  it('renders all items as a list', () => {
    render(
      <TrustBar
        items={[{ label: 'GDPR' }, { label: 'verified', icon: '✓' }]}
      />,
    );
    expect(screen.getByText('GDPR')).toBeInTheDocument();
    expect(screen.getByText('verified')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders nothing when items array is empty', () => {
    const { container } = render(<TrustBar items={[]} />);
    expect(container.querySelector('li')).toBeNull();
  });
});
