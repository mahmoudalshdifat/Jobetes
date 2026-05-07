import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from './Select.js';

describe('Select', () => {
  it('renders options and forwards value', () => {
    render(
      <Select aria-label="city" defaultValue="amman">
        <option value="amman">Amman</option>
        <option value="irbid">Irbid</option>
      </Select>,
    );
    const el = screen.getByLabelText('city') as HTMLSelectElement;
    expect(el.value).toBe('amman');
    expect(el.children).toHaveLength(2);
  });

  it('applies custom className without losing defaults', () => {
    render(
      <Select aria-label="x" className="my-custom">
        <option>a</option>
      </Select>,
    );
    const el = screen.getByLabelText('x');
    expect(el.className).toMatch(/my-custom/);
    expect(el.className).toMatch(/rounded-2xl/);
  });
});
