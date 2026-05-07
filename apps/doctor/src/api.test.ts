import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminSummary } from './api.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('fetchAdminSummary', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://kzz.supabase.co');
  });

  it('attaches the Bearer token + returns parsed JSON on 200', async () => {
    let captured: Record<string, string> = {};
    globalThis.fetch = vi.fn(async (_url, init) => {
      captured = (init?.headers as Record<string, string>) ?? {};
      return new Response(
        JSON.stringify({ intakes: 5, appointments: 2, recentIntakes: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    const r = await fetchAdminSummary('test-token');
    expect(r.intakes).toBe(5);
    expect(r.appointments).toBe(2);
    expect(captured.Authorization).toBe('Bearer test-token');
  });

  it('attaches apikey header when VITE_SUPABASE_ANON_KEY is set', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key-abc');
    let captured: Record<string, string> = {};
    globalThis.fetch = vi.fn(async (_url, init) => {
      captured = (init?.headers as Record<string, string>) ?? {};
      return new Response(
        JSON.stringify({ intakes: 0, appointments: 0, recentIntakes: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    await fetchAdminSummary('tok');
    expect(captured.apikey).toBe('anon-key-abc');
  });

  it('omits apikey header when VITE_SUPABASE_ANON_KEY is empty', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    let captured: Record<string, string> = {};
    globalThis.fetch = vi.fn(async (_url, init) => {
      captured = (init?.headers as Record<string, string>) ?? {};
      return new Response(
        JSON.stringify({ intakes: 0, appointments: 0, recentIntakes: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    await fetchAdminSummary('tok');
    expect(captured.apikey).toBeUndefined();
  });

  it('throws on 401 with status in message', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('unauthorized', { status: 401 }),
    ) as typeof fetch;
    await expect(fetchAdminSummary('bad-token')).rejects.toThrow(/401/);
  });

  it('throws on 403 with status in message', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('forbidden', { status: 403 }),
    ) as typeof fetch;
    await expect(fetchAdminSummary('non-doctor-token')).rejects.toThrow(/403/);
  });

  it('throws on 500 with status in message', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('boom', { status: 500 }),
    ) as typeof fetch;
    await expect(fetchAdminSummary('tok')).rejects.toThrow(/500/);
  });

  it('hits the /functions/v1/admin-summary URL', async () => {
    let calledUrl = '';
    globalThis.fetch = vi.fn(async (url) => {
      calledUrl = String(url);
      return new Response(
        JSON.stringify({ intakes: 0, appointments: 0, recentIntakes: [] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    await fetchAdminSummary('tok');
    expect(calledUrl).toBe('https://kzz.supabase.co/functions/v1/admin-summary');
  });
});
