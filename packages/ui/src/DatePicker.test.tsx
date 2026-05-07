import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker.js';

describe('DatePicker', () => {
  it('renders trigger button with placeholder', () => {
    render(<DatePicker onChange={vi.fn()} placeholder="Pick a date" />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('opens calendar on click', () => {
    render(<DatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onChange with ISO date when a day is clicked', () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Click day 15
    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);
    expect(onChange).toHaveBeenCalledTimes(1);
    const val = onChange.mock.calls[0]?.[0];
    expect(val).toMatch(/^\d{4}-\d{2}-15$/);
  });

  it('disables days before min date', () => {
    const onChange = vi.fn();
    const today = new Date();
    const min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    render(<DatePicker onChange={onChange} min={min} />);
    fireEvent.click(screen.getByRole('button'));
    // Day 1 should be disabled if today is not the 1st
    const day1 = screen.getByRole('button', { name: '1' });
    if (today.getDate() > 1) {
      expect(day1).toBeDisabled();
    }
  });

  it('clears value when Clear is clicked', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-06-15" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('closes on Escape key', () => {
    render(<DatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
