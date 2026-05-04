import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmergencyBanner } from './EmergencyBanner.js';

describe('EmergencyBanner', () => {
  it('renders message and exposes a `note` role', () => {
    render(<EmergencyBanner message="dial 911" />);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('dial 911');
  });

  it('accepts a custom className', () => {
    const { container } = render(<EmergencyBanner message="x" className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });
});
