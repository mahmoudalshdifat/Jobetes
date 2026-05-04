import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.js';
import { _resetForTests } from './supabase.js';

describe('Doctor portal', () => {
  it('renders mock-mode when env unset', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    _resetForTests();
    render(<App />);
    expect(screen.getByText(/Mock-Modus/u)).toBeInTheDocument();
    expect(screen.getByText(/Doctor Portal/u)).toBeInTheDocument();
  });

  it('shows the GDPR/§203 disclaimer in the footer', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    _resetForTests();
    render(<App />);
    expect(screen.getByText(/§ 203 StGB/u)).toBeInTheDocument();
    expect(screen.getAllByText(/GDPR Art\. 9/u).length).toBeGreaterThan(0);
  });
});
