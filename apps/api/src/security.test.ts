import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
});

afterAll(async () => {
  await app.close();
});

describe('Security headers', () => {
  it('emits HSTS with long max-age + includeSubDomains + preload', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    const hsts = res.headers['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=\d{8,}/u);
    expect(hsts).toMatch(/includeSubDomains/u);
    expect(hsts).toMatch(/preload/u);
  });

  it('emits CSP with strict directives', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    const csp = res.headers['content-security-policy'] as string;
    expect(csp).toMatch(/default-src 'self'/u);
    expect(csp).toMatch(/frame-ancestors 'none'/u);
    expect(csp).toMatch(/object-src 'none'/u);
    expect(csp).toMatch(/base-uri 'self'/u);
  });

  it('sets Referrer-Policy', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('disables MIME sniffing', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('blocks framing (X-Frame-Options or CSP frame-ancestors)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    const xfo = res.headers['x-frame-options'];
    const csp = res.headers['content-security-policy'] as string;
    expect(xfo === 'SAMEORIGIN' || xfo === 'DENY' || /frame-ancestors 'none'/u.test(csp)).toBe(true);
  });

  it('rejects unknown CORS origin', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'GET',
      },
    });
    // CORS rejection comes via missing Access-Control-Allow-Origin header
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });
});
