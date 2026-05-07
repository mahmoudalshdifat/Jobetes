import { describe, expect, it, vi } from 'vitest';
import { PUBLIC_FUNCTIONS, pingAll, pingFunction } from './service-status.js';

describe('pingFunction', () => {
  it('returns ok=false latencyMs=-1 when supabaseUrl missing', async () => {
    const r = await pingFunction('health', undefined, vi.fn());
    expect(r).toEqual({ name: 'health', ok: false, latencyMs: -1 });
  });

  it('returns ok=true on 200', async () => {
    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 })) as unknown as typeof fetch;
    let t = 0;
    const r = await pingFunction('health', 'https://x', fetchMock, () => (t += 25));
    expect(r.name).toBe('health');
    expect(r.ok).toBe(true);
    expect(r.latencyMs).toBe(25);
  });

  it('treats HTTP 405 (method-not-allowed) as alive', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 405 })) as unknown as typeof fetch;
    const r = await pingFunction('triage', 'https://x', fetchMock);
    expect(r.ok).toBe(true);
  });

  it('treats HTTP 500 as down', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    const r = await pingFunction('triage', 'https://x', fetchMock);
    expect(r.ok).toBe(false);
  });

  it('treats fetch throw as down (network error)', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const r = await pingFunction('triage', 'https://x', fetchMock);
    expect(r.ok).toBe(false);
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('uses GET for health + doctor-profile, OPTIONS for others', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      calls.push(init?.method ?? 'GET');
      return new Response('', { status: 200 });
    }) as unknown as typeof fetch;
    await pingFunction('health', 'https://x', fetchMock);
    await pingFunction('doctor-profile', 'https://x', fetchMock);
    await pingFunction('triage', 'https://x', fetchMock);
    expect(calls).toEqual(['GET', 'GET', 'OPTIONS']);
  });
});

describe('pingAll', () => {
  it('pings all PUBLIC_FUNCTIONS in parallel', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch;
    const results = await pingAll('https://x', fetchMock);
    expect(results).toHaveLength(PUBLIC_FUNCTIONS.length);
    expect(results.every((r) => r.ok)).toBe(true);
  });

  it('returns a result for each function name in order', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch;
    const results = await pingAll('https://x', fetchMock);
    const names = results.map((r) => r.name);
    expect(names).toEqual([...PUBLIC_FUNCTIONS]);
  });
});
