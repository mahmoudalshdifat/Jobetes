import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from './Field.js';

describe('Field', () => {
  it('wires label htmlFor to input id', () => {
    render(
      <Field label="Phone">
        {(p) => <input {...p} type="tel" />}
      </Field>,
    );
    const label = screen.getByText('Phone');
    const input = screen.getByLabelText('Phone');
    expect(label).toHaveAttribute('for');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('renders required asterisk', () => {
    const { container } = render(
      <Field label="Name" required>
        {(p) => <input {...p} />}
      </Field>,
    );
    expect(container.textContent).toMatch(/\*/u);
  });

  it('shows hint and links it via aria-describedby', () => {
    render(
      <Field label="Phone" hint="E.164 format">
        {(p) => <input {...p} data-testid="i" />}
      </Field>,
    );
    const input = screen.getByTestId('i');
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByText('E.164 format')).toBeInTheDocument();
  });

  it('shows error with role=alert and links via aria-describedby', () => {
    render(
      <Field label="Phone" error="bad input">
        {(p) => <input {...p} data-testid="i2" />}
      </Field>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('bad input');
    const input = screen.getByTestId('i2');
    expect(input).toHaveAttribute('aria-describedby');
  });
});
