import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stepper } from './Stepper.js';

describe('Stepper', () => {
  it('marks the current step with aria-current', () => {
    render(<Stepper steps={['Identity', 'Symptoms', 'Consent']} currentIndex={1} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    const current = screen.getByText('2');
    expect(current).toHaveAttribute('aria-current', 'step');
  });

  it('renders all step labels', () => {
    render(<Stepper steps={['A', 'B']} currentIndex={0} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders step numbers 1..n', () => {
    render(<Stepper steps={['x', 'y', 'z']} currentIndex={0} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
