import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, JobetesApiClient } from './api-client.js';

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response>): void {
  globalThis.fetch = vi.fn(handler) as typeof fetch;
}

beforeEach(() => {
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('JobetesApiClient', () => {
  it('GETs /health with default edge transport (no /api prefix)', async () => {
    mockFetch(async (url) => {
      expect(url).toBe('/health');
      return new Response(
        JSON.stringify({ status: 'ok', service: 'x', timestamp: 't' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new JobetesApiClient();
    const r = await client.health();
    expect(r.status).toBe('ok');
  });

  it('uses /api prefix when transport=fastify', async () => {
    mockFetch(async (url) => {
      expect(url).toBe('/api/health');
      return new Response(
        JSON.stringify({ status: 'ok', service: 'x', timestamp: 't' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new JobetesApiClient({ transport: 'fastify' });
    await client.health();
  });

  it('rewrites doctor profile path per transport', async () => {
    let lastUrl = '';
    mockFetch(async (url) => {
      lastUrl = String(url);
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    await new JobetesApiClient({ transport: 'edge' }).doctorProfile();
    expect(lastUrl).toBe('/doctor-profile');
    await new JobetesApiClient({ transport: 'fastify' }).doctorProfile();
    expect(lastUrl).toBe('/api/v1/doctor/profile');
  });

  it('honors custom baseUrl with trailing-slash strip', async () => {
    mockFetch(async (url) => {
      expect(url).toBe('https://api.jobetes.health/health');
      return new Response(
        JSON.stringify({ status: 'ok', service: 'x', timestamp: 't' }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new JobetesApiClient({ baseUrl: 'https://api.jobetes.health/' });
    await client.health();
  });

  it('attaches Bearer token when getToken returns one', async () => {
    let captured: HeadersInit | undefined;
    mockFetch(async (_url, init) => {
      captured = init?.headers;
      return new Response('{"user":{"supabaseUserId":"u-1"}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const client = new JobetesApiClient({ getToken: () => 'tok-123' });
    await client.me();
    expect((captured as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('throws ApiError with status + body on non-OK', async () => {
    mockFetch(
      async () =>
        new Response(JSON.stringify({ error: 'invalid_intake' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const client = new JobetesApiClient();
    await expect(client.health()).rejects.toBeInstanceOf(ApiError);
    try {
      await client.health();
    } catch (err) {
      expect((err as ApiError).status).toBe(400);
      expect((err as ApiError).body).toEqual({ error: 'invalid_intake' });
    }
  });
});
