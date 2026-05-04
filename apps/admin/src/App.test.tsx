import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';

describe('Admin Console', () => {
  it('renders mock-mode when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    render(<App />);
    expect(screen.getAllByText(/Admin Console/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/Mock-Modus/u)).toBeInTheDocument();
  });

  it('renders the §203 disclaimer + ISO 27001 mention', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    render(<App />);
    expect(screen.getAllByText(/§ 203 StGB/u).length).toBeGreaterThan(0);
    expect(screen.getByText(/ISO 27001/u)).toBeInTheDocument();
  });
});
